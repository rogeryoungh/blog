---
title: "Several Ways to Optimize Modular Reduction"
pubDate: "2023-02-07"
description: "So fast."
---

> Translated by ChatGPT.

Modulo is slow, especially when the modulus is dynamic.

I have not studied error analysis, so the explanation here is probably rather amateurish (

## Floating-point implementation

Clearly we have the identity

$$
a \bmod m = a - \left\lfloor \frac{a}{m} \right\rfloor m
$$

In general, $m$ is in the `i32` range, and $a \in [0, m^2)$. The simplest implementation is floating-point division.

```cpp
struct ModF {
  u32 m;
  f64 ivm;
  ModF(i32 m_) : m(m_), ivm(1.0 / m) {}
  u32 calc(u64 a) const {
    u32 r = a - i64(a * ivm) * m;
    if (r >= m)
      r -= m;
    if (r < 0)
      r += m;
    return r;
  }
};
```

## Barrett Reduction

Consider an alternative to division. Choose $q, s$ such that

$$
\lfloor a/m \rfloor = \left\lfloor \frac{aq}{2^s} \right\rfloor, \quad q \approx \frac{2^s}{m}
$$

holds for as many $a$ as possible. Since $a$ is an integer, let the error be

$$
\frac{q}{2^s} = \frac{1}{m} + \varepsilon 
$$

When $0 \leqslant a\varepsilon < \frac{1}{m}$, the division is exact, so it is convenient to choose

$$
q = \left\lceil \frac{2^s}{m} \right\rceil = \left\lfloor \frac{2^s + m - 1}{m} \right\rfloor
$$

Then we can derive

$$
\varepsilon = \frac{q}{2^s} - \frac{1}{m} < \frac{2^s + m - 1}{2^sm}  -\frac{1}{m} = \frac{m-1}{m 2^s} < \overline{\varepsilon}
$$

After simplification, $2^s > \frac{m - 1}{m \overline{\varepsilon}}$. If $a \in [0, m^2)$, we roughly need $s \approx 3\log_2 m$.

```cpp
struct Barrett {
  enum { s = 96 };
  static constexpr u128 s2 = u128(1) << s;
  u32 m;
  u128 ivm;
  Barrett(u32 m_) : m(m_), ivm((s2 - 1) / m + 1) {}
  u32 div(u64 a) const {
    return a * ivm >> s;
  }
  u32 calc(u64 a) const {
    return a - u64(div(a)) * m;
  }
};
```

### Multiplication by a fixed value

If we need to compute $a \times b \bmod m$, where $b$ is fixed, part of the formula above can be merged.

The derivation is essentially the same. Reconsider the substituted expression and still choose

$$
q = \left\lceil \frac{2^sb}{m} \right\rceil = \left\lfloor \frac{2^sb + m - 1}{m} \right\rfloor
$$

Since $a$ is an integer, let the error be

$$
\frac{q}{2^s} = \frac{b}{m} + \varepsilon 
$$

When $0 \leqslant a\varepsilon < \frac{1}{m}$, the division is exact. We derive

$$
\varepsilon = \frac{q }{2^s} - \frac{b}{m} < \frac{2^sb + m - 1}{2^s m}  -\frac{b}{m} = \frac{m-1}{m 2^s} < \overline{\varepsilon}
$$

After simplification, $2^s > \frac{m - 1}{m \overline{\varepsilon}}$. If $a \in [0, m)$, we roughly need $s \approx 2\log_2 m$.

```cpp
struct MulBarrett {
  enum { s = 64 };
  static constexpr u128 s2 = u128(1) << s;
  u32 b, m;
  u64 ivm;
  MulBarrett(u32 b_, u32 m_) : b(b_), m(m_), ivm((s2 * b - 1) / m + 1) {}
  u64 div(u64 a) const {
    return u128(a) * ivm >> s;
  }
  u32 calc(u32 a) const {
    return a * b - u64(div(a)) * m;
  }
};
```

### Adjustment

Modulo does not have to be done perfectly in one step.

Consider one adjustment step (it adjusts the modulo result; the division itself cannot be adjusted). Let $0 \leqslant \varepsilon < \frac{1}{m}$, and we get $2^s > a - a / m$. For example, when $a \in [0, m)$, $s \approx \log_2 m$.

Therefore, fixed-value multiplication can be done entirely under `u64`; if the carry flag is obtained through special means, `u64` modulo can also be completed entirely under `u64`.

Since adjustment is allowed, there is no need to be constrained to rounding up. Rounding down can also be implemented.

## Lemire Reduction

The modulo result can be obtained more directly:

$$
\begin{aligned}
r
&= \left\lfloor \left(\frac{a}{m} - \left\lfloor \frac{a}{m} \right\rfloor \right) m \right\rfloor \\
&= \left\lfloor \left(\frac{aq}{2^s} - a \varepsilon - \left\lfloor \frac{aq}{m}  - a \varepsilon \right\rfloor \right) m \right\rfloor \\
&= \left\lfloor \left(aq - \left\lfloor \frac{aq}{2^s}  - a \varepsilon \right\rfloor 2^s - 2^s a \varepsilon \right) \frac{m}{2^s} \right\rfloor
\end{aligned}
$$

Assume the division is exact, i.e. $0 \leqslant a \varepsilon < \frac{1}{m}$. Notice that this can be turned into a modulo:

$$
\begin{aligned}
r
&= \left\lfloor \frac{(aq \bmod 2^s) \cdot m}{2^s}  + a\varepsilon m  \right\rfloor  \\
&= \left\lfloor \frac{(aq \bmod 2^s) \cdot m }{2^s} \right\rfloor
\end{aligned}
$$

The precision is still $s \approx 3\log_2 m$.

```cpp
struct Lemire {
  enum { s = 96 };
  static constexpr u128 s2 = u128(1) << s;
  u32 m;
  u128 q;
  Lemire(u32 m_) : m(m_), q((s2 - 1) / m + 1) {}
  u32 calc(u64 a) const {
    return a * q % s2 * u128(m) >> s;
  }
};
```

### Multiplication by a fixed value

The derivation is the same:

$$
\begin{aligned}
r
&= \left\lfloor \left(aq - \left\lfloor \frac{aq}{2^s}  - a \varepsilon \right\rfloor 2^s - 2^s a \varepsilon \right) \frac{m}{2^s} \right\rfloor \\
&= \left\lfloor \frac{(aq \bmod 2^s) \cdot m }{2^s} \right\rfloor
\end{aligned}
$$

The precision is still the division-exact $s \approx 2\log_2 m$.

```cpp
struct MulLemire {
  enum { s = 64 };
  static constexpr u128 s2 = u128(1) << s;
  u32 b, m;
  u64 q;
  MulLemire(u32 b_, u32 m_) : b(b_), m(m_), q((s2 * b - 1) / m + 1) {}
  u32 calc(u32 a) const {
    return a * q * u128(m) >> s;
  }
};
```

### Adjustment

Lemire Reduction cannot be adjusted.

The previous method can be adjusted because the division error is 1, so after taking modulo the result is only off by a multiple of $m$. Here we directly compute the modulo result. If it is off by 1 or 2, there is no way to correct it, so adjustment is impossible.

## Montgomery multiplication

Montgomery multiplication can make better use of SIMD acceleration, and compilers can also auto-vectorize it.

The adjusted Barrett fixed-value multiplication optimization does not involve `u128`, so compilers can vectorize it as well, but the division cost is high. In short, it still does not work very well.

### Montgomery space

Let the constant $r$ satisfy $ \gcd(r, m) = 1$ and $r \geqslant m$. Usually we choose $2^{64}$ or $2^{32}$.

Define the value of $x$ in Montgomery space as

$$
\overline{x} = xr \bmod m
$$

Addition and subtraction are trivial:

$$
\overline{x} \pm \overline{y} = (x \pm y) r \bmod m
$$

Multiplication is a bit special:

$$
\overline{x} \ast \overline{y} = xy r = \overline{x} \cdot \overline{y} \cdot r^{-1} \bmod m
$$

So the key lies in two functions:

- `transform`: compute $x \cdot r \bmod m$.
- `reduce`: compute $x \cdot r^{-1} \bmod m$.

### Reduce

Montgomery pointed out that division by 2 does not require division:

$$
\frac{a}{2} \bmod m  =
\begin{cases}
\frac{a}{2}  &, a \text{ is even} \\
\frac{a + m}{2} &, a\text{ is odd} \\
\end{cases}
$$

And when, for example, $r = 2^{32}$,

$$
a - a \equiv a - m (a m^{-1}) \equiv 0 \pmod r
$$

Therefore set $\mu = -m^{-1} \bmod r$, and we have

$$
x r^{-1} \equiv \frac{x + m(x\mu \bmod r)}{r} \pmod m 
$$

Considering the value range, the expression above is less than $2m$. But the intermediate value does not have to be normalized; we can be lazy and normalize only when mapping back out.

### Transform

The input is usually $[0, m)$, so multiplying directly is enough. We can also use reduction, but it is not better.

Maybe Barrett can optimize this? I have not tested it; I guess the adjusted version might be faster.

### Faster inverse modulo $2^k$

When $r$ is a power of $2$, the inverse can be computed with Newton iteration. Suppose $x$ is the inverse of $a$ modulo $2^k$:

$$
ax \equiv 2^k q + 1 \pmod {2^{2k}}
$$

Then

$$
ax(2-ax) \equiv 1 - 2^{2k}q^2 \equiv 1 \pmod {2^{2k}}
$$

## Implementation

```cpp
struct Montgomery {
  u32 m, ir;
  static u32 inv_m(u32 m) {
    u32 x = 1;
    for (i32 i = 0; i < 5; ++i)
      x *= 2 - x * m;
    return x;
  }
  Montgomery(u32 m_) : m(m_), ir(-inv_m(m)) {}
  u32 tran(u32 a) const {
    return (u64(a) << 32) % m;
  }
  u32 val(u32 a) const { // itrans
    return redc_m(redc(a) - m);
  }
  u32 add(u32 a, u32 b) const {
    return redc_m2(a + b - m * 2);
  }
  u32 sub(u32 a, u32 b) const {
    return redc_m2(a - b);
  }
  u32 redc_m(u32 a) const {
    return a >> 31 ? a + m : a;
  }
  u32 redc_m2(u32 a) const {
    return a >> 31 ? a + m * 2 : a;
  }
  u32 redc(u64 a) const {
    return (a + u64(u32(a) * ir) * m) >> 32;
  }
  u32 mul(u32 a, u32 b) const {
    return redc(u64(a) * b);
  }
};
```

## Others

[@platelet](https://www.luogu.com.cn/blog/plateIet/modulo-proof) mentioned the fixed-value multiplication optimization of Lemire Reduction in his blog post [A Modulo Algorithm Twice as Fast as the Compiler's Implementation](https://www.luogu.com.cn/blog/plateIet/modulo). But division is too expensive. In a long $n$ NTT there are $O(n)$ roots of unity to process, so it does not show an advantage. Barrett is actually a bit better.

Since division is expensive, maybe initialization can also be wrapped with Barrett? I will try it next time when I have time.

## References

- https://en.wikipedia.org/wiki/Barrett_reduction
- https://en.algorithmica.org/hpc/arithmetic/division/
- https://arxiv.org/pdf/1407.3383.pdf
