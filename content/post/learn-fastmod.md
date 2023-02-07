---
author: "rogeryoungh"
title: "优化取模的几种方法"
date: "2023-02-07"
description: "好快。"
---

取模是很慢的，尤其是当模数是动态的数时。

我没学过误差分析，大概讲法很民科（

## 浮点实现

显然有等式

$$
a \bmod m = a - \left\lfloor \frac{a}{m} \right\rfloor m
$$

一般情况下是 $m$ 是 `i32` 范围，且 $a \in [0, m^2)$，最简单的实现方式就是浮点除法。

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

考虑除法的一个替代，选取 $q, s$ 使得等式

$$
\lfloor a/m \rfloor = \left\lfloor \frac{aq}{2^s} \right\rfloor, \quad q \approx \frac{2^s}{m}
$$

对尽可能多的 $a$ 成立。由于 $a$ 是整数，设误差是

$$
\frac{q}{2^s} = \frac{1}{m} + \varepsilon 
$$

当满足 $0 \leqslant a\varepsilon < \frac{1}{m}$ 则除法是精确的，因此选择

$$
q = \left\lceil \frac{2^s}{m} \right\rceil = \left\lfloor \frac{2^s + m - 1}{m} \right\rfloor
$$

是比较方便的。可以推得

$$
\varepsilon = \frac{q}{2^s} - \frac{1}{m} < \frac{2^s + m - 1}{2^sm}  -\frac{1}{m} = \frac{m-1}{m 2^s} < \overline{\varepsilon}
$$

化简得到 $2^s > \frac{m - 1}{m \overline{\varepsilon}}$。假如 $a \in [0, m^2)$，大概需要 $s \approx 3\log_2 m$。

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

### 乘定值

倘若我们要计算 $a \times b \bmod m$，其中 $b$ 是定值，可以把上式的一部分合并。

推导过程没什么区别，重新考虑带入式，仍选择

$$
q = \left\lceil \frac{2^sb}{m} \right\rceil = \left\lfloor \frac{2^sb + m - 1}{m} \right\rfloor
$$

由于 $a$ 是整数，设误差是

$$
\frac{q}{2^s} = \frac{b}{m} + \varepsilon 
$$

当满足 $0 \leqslant a\varepsilon < \frac{1}{m}$ 则除法是精确的。推得

$$
\varepsilon = \frac{q }{2^s} - \frac{b}{m} < \frac{2^sb + m - 1}{2^s m}  -\frac{b}{m} = \frac{m-1}{m 2^s} < \overline{\varepsilon}
$$

化简得到 $2^s > \frac{m - 1}{m \overline{\varepsilon}}$。假如 $a \in [0, m)$，大概需要 $s \approx 2\log_2 m$。

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

### 调整

取模可以没必要一次到位。

考虑一次调整（是调整取模结果，除法无法调整），即令 $0 \leqslant \varepsilon < \frac{1}{m}$，可以得到 $2^s > a - a / m$，例如当 $a \in [0, m)$ 时有 $s \approx \log_2 m$。

因此，定值乘法可以仅在 `u64` 下进行；若通过特殊的手段得到进位标志，`u64` 取模也是能仅在 `u64` 下完成的。

因为允许调整，也就不必拘泥于向上取整，向下取整也是可以实现的。

## Lemire Reduction

取模结果可以更直接的获得

$$
\begin{aligned}
r
&= \left\lfloor \left(\frac{a}{m} - \left\lfloor \frac{a}{m} \right\rfloor \right) m \right\rfloor \\
&= \left\lfloor \left(\frac{aq}{2^s} - a \varepsilon - \left\lfloor \frac{aq}{m}  - a \varepsilon \right\rfloor \right) m \right\rfloor \\
&= \left\lfloor \left(aq - \left\lfloor \frac{aq}{2^s}  - a \varepsilon \right\rfloor 2^s - 2^s a \varepsilon \right) \frac{m}{2^s} \right\rfloor
\end{aligned}
$$

假定除法精确，即 $0 \leqslant a \varepsilon < \frac{1}{m}$，注意到这里可以化成取模

$$
\begin{aligned}
r
&= \left\lfloor \frac{(aq \bmod 2^s) \cdot m}{2^s}  + a\varepsilon m  \right\rfloor  \\
&= \left\lfloor \frac{(aq \bmod 2^s) \cdot m }{2^s} \right\rfloor
\end{aligned}
$$

精度还是 $s \approx 3\log_2 m$。

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

### 乘定值

同样推导

$$
\begin{aligned}
r
&= \left\lfloor \left(aq - \left\lfloor \frac{aq}{2^s}  - a \varepsilon \right\rfloor 2^s - 2^s a \varepsilon \right) \frac{m}{2^s} \right\rfloor \\
&= \left\lfloor \frac{(aq \bmod 2^s) \cdot m }{2^s} \right\rfloor
\end{aligned}
$$

精度仍是除法精确的 $s \approx 2\log_2 m$。

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

### 调整

Lemire Reduction 无法调整。

前面能调整是因为除法误差为 1，所以取模后只会差 $m$ 的倍数；这里直接算出了取模，差了 1 差了 2 你也没办法校正，所以无法调整。

## Montgomery multiplication

Montgomery multiplication 能够更好的利用 SIMD 加速，编译器也能够自动向量化。

带调整的 Barrett 乘定值优化由于不涉及 `u128`，编译器也能够向量化，但除法的代价较高，总之还是不太行。

### Montgomery 空间

设常数 $r$ 满足 $ \gcd(r, m) = 1$ 且 $r \geqslant m$，一般选择 $2^{64}$ 或 $2^{32}$。

定义 $x$ 在 Montgomery 空间中的值为

$$
\overline{x} = xr \bmod m
$$

加减是平凡的

$$
\overline{x} \pm \overline{y} = (x \pm y) r \bmod m
$$

乘法有些特殊

$$
\overline{x} \ast \overline{y} = xy r = \overline{x} \cdot \overline{y} \cdot r^{-1} \bmod m
$$

因此关键在于两个函数：

- `transform`：计算 $x \cdot r \bmod m$；
- `reduce`：计算 $x \cdot r^{-1} \bmod m$。

### Reduce

Montgomery 指出了除 2 不需要除法：

$$
\frac{a}{2} \bmod m  =
\begin{cases}
\frac{a}{2}  &, a \text{ 是偶数} \\
\frac{a + m}{2} &, a\text{ 是奇数} \\
\end{cases}
$$

且例如 $r = 2^{32}$ 时

$$
a - a \equiv a - m (a m^{-1}) \equiv 0 \pmod r
$$

因此设置 $\mu = -m^{-1} \bmod r$，有

$$
x r^{-1} \equiv \frac{x + m(x\mu \bmod r)}{r} \pmod m 
$$

再考虑值域，发现上式小于 $2m$。但是中间运算的没必要求值，可以惰性一点，最后映出时再规整。

### Transform

一般输入都是 $[0, m)$，直接乘就行；也可以利用 reduction，但是不会更优。

或许可以尝试用 Barrett 优化一下？我没测试过，猜想带调整的更快一点。

### 更快的 $2^k$ 逆元

在 $r$ 是 $2$ 的幂次时，逆元可以用牛顿迭代。假设 $x$ 是 $a$ 在 $2^k$ 下的逆元

$$
ax \equiv 2^k q + 1 \pmod {2^{2k}}
$$

那么

$$
ax(2-ax) \equiv 1 - 2^{2k}q^2 \equiv 1 \pmod {2^{2k}}
$$

## 实现

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

## 其他

[@platelet](https://www.luogu.com.cn/blog/plateIet/modulo-proof) 在他的博客 [速度是编译器实现两倍的取模算法](https://www.luogu.com.cn/blog/plateIet/modulo) 中提到了 Lemire Reduction 的乘定值优化。但是除法的代价太高，在长 $n$ 的 NTT 中有 $O(n)$ 个单位根需要处理，并不能表现出优势。反到是 Barrett 更优一点。

除法代价高，初始化或许可以再套一次 Barrett？下次有空了试试。

## 参考

- https://en.wikipedia.org/wiki/Barrett_reduction
- https://en.algorithmica.org/hpc/arithmetic/division/
- https://arxiv.org/pdf/1407.3383.pdf
