# export DPDK_ROOT=/opt/dpdk/dpdk-stable-24.11.3
export DPDK_ROOT=/usr/local
# export DPDK_USRT=$DPDK_ROOT/usertools
export DPDK_DEVBIND=$DPDK_ROOT/bin/dpdk-devbind.py

echo 4096 | sudo tee /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages
echo 8192 | sudo tee /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages
cat /proc/meminfo | grep -i huge

$DPDK_DEVBIND -s

/ -u 0000:01:00.0            
/dpdk-devbind.py --bind mlx5_core 0000:01:00.0
