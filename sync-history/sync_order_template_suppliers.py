#!/usr/bin/env python3

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
REPORT_DIR = ROOT / "sync-history" / "reports"
ENV_PATH = ROOT / ".env"


def load_env(env_path):
    env = {}
    if not env_path.exists():
        return env
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


ENV = load_env(ENV_PATH)


def env_get(key, default=""):
    return os.environ.get(key) or ENV.get(key, default)


def print_section(title):
    print(f"\n=== {title} ===")


def print_progress(current, total, label):
    print(f"[{current}/{total}] {label}")


def print_info(label):
    print(f"- {label}")


def ask(prompt, default=None):
    suffix = f" [{default}]" if default is not None else ""
    answer = input(f"{prompt}{suffix}: ").strip()
    return answer or (default if default is not None else "")


def get_retailer():
    return env_get("KIOT_RETAILER", "cretasolu")


def get_branch_ids():
    raw = env_get("KIOT_BRANCH_ID") or env_get("KIOT_BRANCH_IDS")
    if not raw:
        return [12961]
    ids = []
    for item in str(raw).split(","):
        item = item.strip()
        if not item:
            continue
        try:
            value = int(item)
        except ValueError:
            continue
        if value > 0:
            ids.append(value)
    return ids or [12961]


TOKEN_CACHE = {"checked_at": 0, "token": ""}


def http_json(url, method="GET", headers=None, body=None):
    request = urllib.request.Request(url=url, method=method)
    for key, value in (headers or {}).items():
        request.add_header(key, value)
    data = None
    if body is not None:
        if isinstance(body, (dict, list)):
            data = json.dumps(body).encode("utf-8")
            request.add_header("Content-Type", "application/json")
        elif isinstance(body, str):
            data = body.encode("utf-8")
        else:
            data = body
    try:
        with urllib.request.urlopen(request, data=data, timeout=120) as response:
            payload = response.read().decode("utf-8")
            if not payload:
                return {}
            return json.loads(payload)
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"HTTP {exc.code} {url}: {payload[:800]}") from exc


def get_token():
    now = time.time()
    if TOKEN_CACHE["token"] and now - TOKEN_CACHE["checked_at"] < 23 * 60 * 60:
        return TOKEN_CACHE["token"]
    client_id = env_get("KIOT_CLIENT_ID")
    client_secret = env_get("KIOT_CLIENT_SECRET")
    body = urllib.parse.urlencode({
        "scopes": "PublicApi.Access",
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    })
    data = http_json(
        "https://id.kiotviet.vn/connect/token",
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        body=body,
    )
    token = f"{data['token_type']} {data['access_token']}"
    TOKEN_CACHE["checked_at"] = now
    TOKEN_CACHE["token"] = token
    return token


def get_kiot(url):
    return http_json(url, headers={
        "Retailer": get_retailer(),
        "Authorization": get_token(),
    })


def append_query(url, query):
    return url + ("&" if "?" in url else "?") + query


def get_full(url, label="items"):
    current_item = 0
    page_size = 100
    rows = []
    page_index = 0
    while True:
        page_index += 1
        page_url = append_query(url, f"currentItem={current_item}&pageSize={page_size}")
        payload = get_kiot(page_url)
        data = payload.get("data", []) if isinstance(payload, dict) else []
        total = payload.get("total") if isinstance(payload, dict) else None
        rows.extend(data)
        loaded = len(rows)
        if total:
            print_info(f"Tai {label}: page {page_index}, +{len(data)} items, tong {loaded}/{total}")
        else:
            print_info(f"Tai {label}: page {page_index}, +{len(data)} items, tong {loaded}")
        if not data or len(data) < page_size:
            break
        current_item += len(data)
    return rows


def get_full_products():
    url = "https://public.kiotapi.com/products?includeInventory=true"
    branch_ids = get_branch_ids()
    if branch_ids:
        url = append_query(url, "BranchIds=" + ",".join(str(item) for item in branch_ids))
    return get_full(url, label="products")


def get_product_by_code(code):
    url = f"https://public.kiotapi.com/products/code/{urllib.parse.quote(code)}?includeInventory=true"
    branch_ids = get_branch_ids()
    if branch_ids:
        url = append_query(url, "BranchIds=" + ",".join(str(item) for item in branch_ids))
    return get_kiot(url)


def get_full_purchaseorders():
    return get_full("https://public.kiotapi.com/purchaseorders", label="purchaseorders")


def parse_datetime(value):
    if not value:
        return None
    raw = str(value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(raw)
    except ValueError:
        return None


def build_ncc_line(rank, supplier):
    if not supplier:
        return ""
    code = str(supplier.get("supplierCode") or "").strip()
    name = str(supplier.get("supplierName") or "").strip()
    payload = f"{code} | {name}" if code and name else (code or name)
    return f"#NCC-{rank}: {payload}" if payload else ""


def parse_ncc_lines(lines):
    result = {}
    for line in lines:
        stripped = line.strip()
        if stripped.lower().startswith("#ncc-1:"):
            result["ncc1"] = stripped.split(":", 1)[1].strip()
        if stripped.lower().startswith("#ncc-2:"):
            result["ncc2"] = stripped.split(":", 1)[1].strip()
    return result


def remove_managed_ncc_lines(lines):
    result = []
    for line in lines:
        stripped = line.strip().lower()
        if stripped.startswith("#ncc-1:") or stripped.startswith("#ncc-2:"):
            continue
        result.append(line.rstrip())
    return result


def build_next_order_template(current_template, ranked_suppliers):
    original_lines = [line.rstrip() for line in str(current_template or "").splitlines()]
    cleaned_lines = remove_managed_ncc_lines(original_lines)
    next_lines = list(cleaned_lines)
    line1 = build_ncc_line(1, ranked_suppliers[0] if len(ranked_suppliers) > 0 else None)
    line2 = build_ncc_line(2, ranked_suppliers[1] if len(ranked_suppliers) > 1 else None)
    if line1:
        next_lines.append(line1)
    if line2:
        next_lines.append(line2)
    next_template = "\n".join([line for line in next_lines if line is not None]).strip()
    return {
        "currentNcc": parse_ncc_lines(original_lines),
        "nextNcc": parse_ncc_lines(next_lines),
        "nextOrderTemplate": next_template,
    }


def get_history_start_date(history_window):
    now = datetime.now(timezone.utc)
    if history_window == "12m":
        return now - timedelta(days=365)
    if history_window == "24m":
        return now - timedelta(days=730)
    return None


def matches_scope(product_code, product_codes):
    if not product_codes:
        return True
    return product_code in product_codes


def aggregate_suppliers_by_product(purchaseorders, product_codes, history_window):
    start_date = get_history_start_date(history_window)
    grouped = defaultdict(lambda: defaultdict(lambda: {
        "supplierCode": "",
        "supplierName": "",
        "supplierId": 0,
        "count": 0,
        "totalQuantity": 0,
        "lastPurchaseDate": None,
    }))
    total_orders = len(purchaseorders or [])
    matched_orders = 0
    matched_lines = 0
    for index, order in enumerate(purchaseorders, start=1):
        if index == 1 or index % 100 == 0 or index == total_orders:
            print_info(f"Xu ly purchaseorders: {index}/{total_orders}, matched_orders={matched_orders}, matched_lines={matched_lines}, products={len(grouped)}")
        if int(order.get("status") or 0) != 3:
            continue
        order_date = parse_datetime(order.get("purchaseDate") or order.get("createdDate"))
        if start_date and order_date and order_date.astimezone(timezone.utc) < start_date:
            continue
        supplier_code = str(order.get("supplierCode") or "").strip()
        supplier_name = str(order.get("supplierName") or "").strip()
        if not supplier_code and not supplier_name:
            continue
        order_had_match = False
        supplier_key = supplier_code or supplier_name
        for line in order.get("purchaseOrderDetails") or []:
            product_code = str(line.get("productCode") or "").strip()
            if not product_code or not matches_scope(product_code, product_codes):
                continue
            order_had_match = True
            matched_lines += 1
            entry = grouped[product_code][supplier_key]
            entry["supplierCode"] = supplier_code
            entry["supplierName"] = supplier_name
            entry["supplierId"] = int(order.get("supplierId") or 0)
            entry["count"] += 1
            entry["totalQuantity"] += float(line.get("quantity") or 0)
            if not entry["lastPurchaseDate"] or (order_date and order_date > parse_datetime(entry["lastPurchaseDate"])):
                entry["lastPurchaseDate"] = order.get("purchaseDate") or order.get("createdDate")
        if order_had_match:
            matched_orders += 1
    return grouped


def rank_suppliers(grouped_for_product):
    rows = list(grouped_for_product.values())
    rows.sort(key=lambda item: (
        -int(item.get("count") or 0),
        -(parse_datetime(item.get("lastPurchaseDate")) or datetime.fromtimestamp(0, tz=timezone.utc)).timestamp(),
    ))
    return rows[:2]


def choose_options():
    print_section("Supplier Sync Options")
    mode = ask("Mode (preview/write)", "preview").lower()
    if mode not in {"preview", "write"}:
        mode = "preview"

    scope = ask("Scope (one/many/all)", "all").lower()
    if scope not in {"one", "many", "all"}:
        scope = "all"

    product_codes = []
    if scope == "one":
        code = ask("Nhap productCode")
        if code:
            product_codes = [code.strip()]
    elif scope == "many":
        raw_codes = ask("Nhap productCodes, cach nhau boi dau phay")
        product_codes = [item.strip() for item in raw_codes.split(",") if item.strip()]

    policy = ask("Policy (only-empty/replace-if-different)", "replace-if-different").lower()
    if policy not in {"only-empty", "replace-if-different"}:
        policy = "replace-if-different"

    history_window = ask("History window (all/12m/24m)", "24m").lower()
    if history_window not in {"all", "12m", "24m"}:
        history_window = "24m"

    save_report = ask("Save JSON report? (y/n)", "y").lower() != "n"

    if mode == "write":
        confirm = ask("Xac nhan WRITE len KiotViet? (yes/no)", "no").lower()
        if confirm != "yes":
            mode = "preview"

    return {
        "mode": mode,
        "scope": scope,
        "productCodes": product_codes,
        "policy": policy,
        "historyWindow": history_window,
        "saveReport": save_report,
    }


def run():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    config = choose_options()

    print_section("Loading KiotViet Data")
    print_progress(1, 2, "Tai danh sach purchaseorders")
    purchaseorders = get_full_purchaseorders()
    print_progress(2, 2, "Tai danh sach products")
    if config["productCodes"]:
        products = []
        for code in config["productCodes"]:
            try:
                products.append(get_product_by_code(code))
            except Exception as exc:
                print(f"Skip product {code}: {exc}")
    else:
        products = get_full_products()

    print_section("Aggregating Supplier Suggestions")
    grouped = aggregate_suppliers_by_product(purchaseorders, config["productCodes"], config["historyWindow"])
    scoped_products = [
        product for product in products
        if str(product.get("code") or "").strip()
        and matches_scope(str(product.get("code") or "").strip(), config["productCodes"])
        and str(product.get("code") or "").strip() in grouped
    ]

    results = []
    changed_count = 0
    skipped_count = 0

    for index, product in enumerate(scoped_products, start=1):
        code = str(product.get("code") or "").strip()
        ranked = rank_suppliers(grouped[code])
        templates = build_next_order_template(product.get("orderTemplate") or "", ranked)
        current_ncc1 = str(templates["currentNcc"].get("ncc1") or "").strip()
        current_ncc2 = str(templates["currentNcc"].get("ncc2") or "").strip()
        next_ncc1 = str(templates["nextNcc"].get("ncc1") or "").strip()
        next_ncc2 = str(templates["nextNcc"].get("ncc2") or "").strip()

        action = "unchanged"
        if current_ncc1 != next_ncc1 or current_ncc2 != next_ncc2:
            if config["policy"] == "only-empty" and current_ncc1:
                action = "skipped"
            elif not current_ncc1 and not current_ncc2:
                action = "append"
            else:
                action = "replace"

        if action in {"append", "replace"}:
            changed_count += 1
        else:
            skipped_count += 1

        print_progress(index, len(scoped_products), f"{code} -> {action}")

        results.append({
            "productId": product.get("id"),
            "productCode": code,
            "productName": product.get("name") or "",
            "currentOrderTemplate": product.get("orderTemplate") or "",
            "nextOrderTemplate": templates["nextOrderTemplate"],
            "action": action,
            "rankedSuppliers": ranked,
        })

    print_section("Summary")
    print(f"Mode: {config['mode']}")
    print(f"Products processed: {len(scoped_products)}")
    print(f"Changed: {changed_count}")
    print(f"Skipped/Unchanged: {skipped_count}")

    if config["saveReport"]:
        output_path = REPORT_DIR / f"supplier-sync-{int(time.time())}-{config['mode']}.json"
        output_path.write_text(json.dumps({
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "config": config,
            "total": len(scoped_products),
            "changedCount": changed_count,
            "skippedCount": skipped_count,
            "results": results,
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Report saved: {output_path}")


if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        print("\nCancelled")
        sys.exit(1)
    except Exception as exc:
        print(f"SYNC FAILED: {exc}")
        sys.exit(1)
