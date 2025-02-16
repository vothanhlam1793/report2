Vue.component('barcode-view', {
  props: ['invoice_code', 'product_code'],
  data() {
    return {
      productBarcodesModel: new ModelProDuctBarcodes(this.product_code, this.invoice_code),
      productBarcodes: [],
      new_barcode: '',
      isScanning: false,
      scanner: null
    };
  },
  methods: {
    add_barcode() {
      if (!this.new_barcode.trim()) return;

      this.productBarcodesModel.addInvoiceProductBarcode(
        this.invoice_code,
        this.product_code,
        this.getName(),
        this.new_barcode.trim()
      );

      console.log('Barcode added:', this.new_barcode);
      this.new_barcode = '';

      this.refreshProductBarcodes();

      this.$nextTick(() => this.$refs.barcodeInput.focus());
    },
    delete_barcode(barcode) {
      this.productBarcodesModel.deleteInvoiveProductBarcode(this.invoice_code, this.product_code, barcode);
      console.log('Barcode deleted:', barcode);

      this.refreshProductBarcodes();
    },
    getName() {
      return this.productBarcodesModel.invoiceKiot?.invoiceDetails?.find(
        p => p.productCode === this.product_code
      )?.productName || 'Không xác định';
    },
    refreshProductBarcodes() {
      this.productBarcodesModel.getProductBarcodeByProductCode(this.product_code, this.invoice_code);
    },
    startScanning() {
      if (this.isScanning) {
        this.stopScanning();
        return;
      }

      this.isScanning = true;

      this.$nextTick(() => {
        if (!this.scanner) {
          this.scanner = new Html5Qrcode("barcode-scanner");
        }

        // Kiểm tra quyền truy cập camera trước khi mở scanner
        navigator.mediaDevices.getUserMedia({ video: true }).then(() => {
          this.scanner.start(
            { facingMode: { exact: "environment" } }, // Mở camera sau trên iOS
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            decodedText => {
              console.log("Scanned barcode:", decodedText);
              this.new_barcode = decodedText;
              this.add_barcode();
              this.stopScanning();
            },
            errorMessage => {
              console.warn("Scan error:", errorMessage);
            }
          );
        }).catch(err => {
          alert("Không thể mở camera. Hãy kiểm tra quyền truy cập.");
          console.error("Camera error:", err);
          this.isScanning = false;
        });
      });
    },
    stopScanning() {
      if (this.scanner) {
        this.scanner.stop().then(() => {
          console.log("Scanner stopped");
        }).catch(err => {
          console.warn("Error stopping scanner:", err);
        });
      }
      this.isScanning = false;
    }
  },
  mounted() {
    this.productBarcodesModel.onUpdateData = () => {
      this.productBarcodes = [...this.productBarcodesModel.invoiceProductBarcodes];
      this.$forceUpdate(); // Bắt Vue cập nhật UI ngay lập tức
    };

    this.refreshProductBarcodes();
  },
  template: `
    <div class="flex flex-col min-h-screen bg-gray-100 p-4">
        <div class="bg-blue-500 text-white text-center py-4 rounded-lg shadow-lg">
            <h2 class="text-xl font-bold">Quản lý Barcode</h2>
            <p class="text-sm">{{ invoice_code }} - {{ getName() }}</p>
        </div>

        <div class="flex-grow overflow-auto mt-4">
            <div v-for="barcode in productBarcodes" 
                 :key="barcode.code"
                 class="flex items-center justify-between bg-white p-3 rounded-lg shadow mb-2">
                <span class="text-lg font-semibold">{{ barcode.code }}</span>
                <button @click="delete_barcode(barcode.code)" 
                        class="bg-red-500 text-white px-3 py-1 rounded-lg">
                    Xóa
                </button>
            </div>
        </div>

        <div class="fixed bottom-0 left-0 w-full bg-white shadow-lg p-4">
            <div v-if="isScanning">
                <div id="barcode-scanner" class="w-full h-64 bg-gray-200"></div>
                <button @click="stopScanning" 
                        class="w-full bg-red-500 text-white py-2 rounded-lg mt-2">
                    Dừng Quét
                </button>
            </div>

            <input ref="barcodeInput" 
                   class="w-full px-4 py-2 border rounded-lg text-lg" 
                   placeholder="Nhập barcode..."
                   v-model="new_barcode" 
                   @keyup.enter="add_barcode">

            <button @click="add_barcode" 
                    class="w-full bg-green-500 text-white py-2 rounded-lg mt-2">
                Thêm
            </button>

            <button @click="startScanning" 
                    class="w-full bg-blue-500 text-white py-2 rounded-lg mt-2">
                {{ isScanning ? "Dừng Quét" : "Quét Mã Vạch" }}
            </button>
        </div>
    </div>
  `
});

new Vue({
  el: '#barcodeApp'
});
