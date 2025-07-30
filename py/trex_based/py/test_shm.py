import mmap
import multiprocessing as mp
import os
import time


def writer(fd, size, iterations):
    with mmap.mmap(fd, size, access=mmap.ACCESS_WRITE) as mm:
        data = bytes([0xAA] * size)
        for _ in range(iterations):
            mm.seek(0)
            mm.write(data)


def reader(fd, size, iterations):
    checksum = 0
    with mmap.mmap(fd, size, access=mmap.ACCESS_READ) as mm:
        for _ in range(iterations):
            mm.seek(0)
            checksum += sum(mm.read(size))
    print(f"Reader checksum: {checksum}")


def main():
    size = 1024 * 1024  # 1 MB
    iterations = 1000

    # Создаём temp-файл для mmap
    fd = os.open("mmap_temp", os.O_CREAT | os.O_TRUNC | os.O_RDWR)
    os.write(fd, b'\x00' * size)  # Выделяем место

    p_writer = mp.Process(target=writer, args=(fd, size, iterations))
    p_reader = mp.Process(target=reader, args=(fd, size, iterations))

    t0 = time.time()

    p_writer.start()
    p_reader.start()

    p_writer.join()
    p_reader.join()

    t1 = time.time()

    elapsed = t1 - t0
    total_bytes = size * iterations * 2
    speed_mbps = (total_bytes / elapsed) / (1024 * 1024)

    print(f"Elapsed time: {elapsed:.2f} s")
    print(f"Approx. mmap transfer speed: {speed_mbps:.2f} MB/s")

    os.close(fd)
    os.remove("mmap_temp")


if __name__ == "__main__":
    main()
