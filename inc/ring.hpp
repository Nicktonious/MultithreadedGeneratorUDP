#ifndef RING_HPP
#define RING_HPP

#include <atomic>
#include <cassert>
#include <condition_variable>
#include <cstdint>
#include <cstdlib>
#include <utility>

template <typename T>
class Ring {
    static constexpr size_t Size = 0x100;  /// fixed-size with byte counters
    static constexpr size_t Mask = (Size - 1);  /// ring mask
    static_assert((Size & (Size - 1)) == 0, "Size must be power of 2");
    static_assert(Size <= 0x100, "byte-sized indexes used");
    static_assert(Size >= 0x10, "Too small");

    alignas(64) T data[Size];  ///< packet buffer allocated in DPDK mbuf memory
    alignas(64) std::atomic<uint8_t> read{0};   ///< read pointer
    alignas(64) std::atomic<uint8_t> write{0};  ///< write pointer
    alignas(64) uint8_t count = 0;              ///< used elements in @ref data

    Ring(const Ring&) = delete;             ///< no copy
    Ring& operator=(const Ring&) = delete;  ///< no copy

   public:
    Ring() = default;
    ~Ring() = default;

    /// @name SPCS producer-only
    /// @{
    void push(const T& item);      ///< push element
    void push(T&& item) noexcept;  ///< push with r-value

    /// @}

    /// @name SPCS consumer-only
    /// @{
    T pop();  ///< pop element

    /// @}

    /// @name current size-related
    /// @{
    bool empty() const noexcept;   ///< empty check
    bool full() const noexcept;    ///< overflow check
    size_t size() const noexcept;  ///< current queue size

    /// @}
};

#include "ring.cpp"

#endif  // RING_HPP
