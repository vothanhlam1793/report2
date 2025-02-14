export DOCKER_DEFAULT_PLATFORM=linux/amd64
docker build -t $1:$2 --force-rm -f Dockerfile .