---
author: "rogeryoungh"
title: "FFT & NTT 学习笔记"
date: "2021-07-22"
description: "FFT 怎么这么难啊。"
mathjax: true
tags: [多项式]
---

前置知识：复数，需要理解 Euler 公式。

以下是我对 FFT 的感性理解，可能并不严谨，如有错误欢迎指正。

## FFT

### 多项式乘法

对于 $n$ 次多项式

{{< display-math >}}
\begin{aligned}
f(x) = \sum_{i=0}^n f_ix^i &=  f_0 + f_1 x + f_2x^2 + \cdots + g_nx^n \\
g(x) = \sum_{i=0}^n g_ix^i &=  g_0 + g_1 x + g_2x^2 + \cdots + g_nx^n
\end{aligned}
{{< /display-math >}}

它们的乘法是 $F(x) = f(x)g(x) = \sum\limits_{k=0}^{2n} c_kx^k$，其中

{{< display-math >}}
c_k = \sum_{i+j=k}f_ig_j
{{< /display-math >}}

因此计算多项式的乘积需要 $n^2$ 次系数乘法，我们需要优化。

### 点值表示法

$n$ 次多项式 $f(x)$ 可以由 $n+1$ 个系数决定，也可以由 $n+1$ 个座标（点值）决定。即 $n$ 次多项式可以看作 $n+1$ 维的向量。

考虑选取 $2n+1$ 个座标来确定 $f(x)$ 和 $g(x)$。则 $F(x)$ 可以简单的通过做 $2n+1$ 次乘法得到

{{< display-math >}}
(x_k,F(x_k)) = \left(x_k, f(x_k)g(x_k)\right)
{{< /display-math >}}

于是求多项式的乘法，可以先从系数表示法转换为点值表示法，做完乘法再变回去。

### DFT

怎么把多项式转换成点值呢？我们有离散 Fourier 变换。称方程 $x^n = 1$ 的 $n$ 个解为单位根。

设多项式 $f(x) = \sum\limits_{k=0}^{n-1} f_kx^k$，并选择一个单位根 $\omega$，则称向量

{{< display-math >}}
\operatorname{DFT}_{\omega}(f) =( f(1), f(\omega^1), \cdots, f(\omega^{n-1}) )
{{< /display-math >}}

为 $f$ 的离散 Fourier 变换（Discrete Fourier Transform）。

DFT 存在逆变换（IDFT），即从点值重新变回系数，仍是从向量到向量的变换。

IDFT 存在性质

{{< display-math >}}
(\operatorname{DFT}_{\omega})^{-1} = \frac{1}{n} (\operatorname{DFT}_{{\omega}^{-1}})
{{< /display-math >}}

篇幅所限，不放证明（~~我不会证~~）。现在我们可以统一的处理 DFT 和 IDFT。

### 单位原根

至此，我们计算 DFT 的复杂度仍然是 $O(n^2)$，其与 FFT 的关键差别就是选取特殊的点加速计算。

单位根中特殊的一个记作 $\omega_n = e^{\frac{2 \pi i}{n}}$，它叫做单位原根。根据 Euler 公式，有

{{< display-math >}}
\omega_n = e^{\tfrac{2 \pi i}{n}} = \cos \left(\frac{2\pi}{n}\right) + i \sin \left(\frac{2\pi}{n}\right)
{{< /display-math >}}

即 $\omega_n$ 是单位圆上的一个点，全部的 $n$ 个单位根

{{< display-math >}}
x_k = \omega_n^k = e^{k\tfrac{2 \pi i}{n}} = \cos \left(\frac{2\pi k}{n}\right) + i \sin \left(\frac{2\pi k}{n}\right) 
{{< /display-math >}}

恰全是单位元的 $n$ 等分点。因此根据 Euler 公式，**单位根之间的乘法就是在单位元上转圈圈。**

不难通过 Euler 公式验证单位原根 $\omega_n$ 的几条性质：

- $\omega_{2n}^{2k} = \omega_n^k$。
- $\omega_{2n}^{n+k} = -\omega_{2n}^k$。

### 分治

利用单位原根的特殊性，我们可以分治计算 DFT。比如对于 $7$ 次多项式

{{< display-math >}}
\begin{aligned}
f(x) &= f_0 + f_1x + f_2x^2 + f_3 x^3 + f_4 x^4 + f_5 x^5 + f_6 x^6 + f_7 x^7 \\
&= (f_0 + f_2x^2 + f_4x^4 + f_6x^6) + x(f_1 + f_3x^2 + f_5x^4 + f_7x^6)
\end{aligned}
{{< /display-math >}}

奇偶分别建立函数

{{< display-math >}}
\begin{aligned}
f^{[0]}(x) &= f_0 + f_2x + f_4x^2 + f_6x^3 \\
f^{[1]}(x) &= f_1 + f_3x + f_5x^2 + f_7x^3
\end{aligned}
{{< /display-math >}}

则原来的函数可以表示为

{{< display-math >}}
f(x) = f^{[0]}(x^2) + xf^{[1]}(x^2)
{{< /display-math >}}

一般的，对于度小于 $n$ 的多项式 $f(x)$，利用单位原根的性质有

{{< display-math >}}
\begin{aligned}
f(\omega_{n}^k) &= f^{[0]}(\omega_{n}^k \cdot \omega_{n}^k) + \omega_{n}^kf^{[1]}(\omega_{n}^k \cdot \omega_{n}^k) \\
&= f^{[0]}(\omega_{n}^{2k}) + \omega_{n}^kf^{[1]}(\omega_{n}^{2k}) \\
&= f^{[0]}(\omega_{n/2}^{k}) + \omega_{n}^kf^{[1]}(\omega_{n/2}^{k})
\end{aligned}
{{< /display-math >}}

同理可得

{{< display-math >}}
\begin{aligned}
f(\omega_{n}^{k+n/2}) &= f^{[0]}(\omega_{n}^{2k+n}) + \omega_{n}^{k+n/2}f^{[1]}(\omega_{n}^{2k+n}) \\
&= f^{[0]}(\omega_{n/2}^{k}) - \omega_{n}^{k}f^{[1]}(\omega_{n/2}^{k})
\end{aligned}
{{< /display-math >}}

因此我们需要把多项式的系数向上补到 $2^n$ 个，方便分治。

在 DFT 中使用有

{{< display-math >}}
\begin{aligned}
\operatorname{DFT}_{\omega}(f)[j] &= \operatorname{DFT}_{\omega^2}(f^{[0]})[j] + \omega^j \operatorname{DFT}_{\omega^2}(f^{[1]})[j] \\
\operatorname{DFT}_{\omega}(f)[j + n/2] &= \operatorname{DFT}_{\omega^2}(f^{[0]})[j] - \omega^j\operatorname{DFT}_{\omega^2}(f^{[1]})[j]
\end{aligned}
{{< /display-math >}}

至此，我们可以写出递归版的 FFT。

```cpp
void FFT(Comp *f, int n, int type) {
    if (n == 1)
        return;
    for (int i = 0; i < n; i++)
        tmp[i] = f[i];
    for (int i = 0; i < n; i++) {  // 偶数放左边，奇数放右边
        if (i & 1)
            f[n / 2 + i / 2] = tmp[i];
        else
            f[i / 2] = tmp[i];
    }
    Comp *g = f, *h = f + n / 2;
    DFT(g, n / 2, type), DFT(h, n / 2, type);
    Comp step(cos(2 * PI / n), sin(2 * PI * type / n)), cur(1, 0);
    for (int k = 0; k < n / 2; k++) {
        tmp[k] = g[k] + cur * h[k];
        tmp[k + n / 2] = g[k] - cur * h[k];
        cur = cur * step;
    }
    for (int i = 0; i < n; i++)
        f[i] = tmp[i];
}
```

### 蝴蝶变换

递归分治总是不尽人意的，如果能一次到位就更好了。还是以 $7$ 次多项式为例

- 初始 $\{x^0,x^1,x^2,x^3,x^4,x^5,x^6,x^7\}$
- 一次 $\{x^0,x^2,x^4,x^6\},\{x^1,x^3,x^5,x^7\}$
- 两次 $\{x^0,x^4\},\{x^2,x^6\},\{x^1,x^5\},\{x^3,x^7\}$
- 结束 $\{x^0\},\{x^4\},\{x^2\},\{x^6\},\{x^1\},\{x^5\},\{x^3\},\{x^7\}$

写出二进制的形式，可以发现规律

| 初始    | 0    | 1    | 2    | 3    | 4    | 5    | 6    | 7    |
| :-----: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| 初始(2) | 000  | 001  | 010  | 011  | 100  | 101  | 110  | 111  |
| 结束(2) | 000  | 100  | 010  | 110  | 001  | 101  | 011  | 111  |
| 结束    | 0    | 4    | 2    | 6    | 1    | 5    | 3    | 7    |

结束和开始的二进制恰好是相反的。这个变换称为蝴蝶变换，也称位逆序置换（bit-reversal permutation）。

我们可以 $O(n)$ 的预处理出变换数组。设 `R(x)` 是 $x$ 的变换结果，则 `R(x>>1)` 是已求的。

{{< display-math >}}
\begin{aligned}
\texttt{000abcd} &\to \texttt{dcba000} \\
\texttt{00abcdx} &\to \texttt{xdcba00}
\end{aligned}
{{< /display-math >}}

即是把 `R(x>>1)` 右移一位再补上最高位即可。代码如下

```cpp
int lim = 1, lim_2;
while (lim <= n + m)
    lim <<= 1;
lim_2 = lim >> 1;
for (int i = 0; i < lim; ++i) {
    rev[i] = rev[i >> 1] >> 1;
    if (i & 1)
        rev[i] |= lim >> 1;
    // 或者合并写为
    // rev[i] = (rev[i >> 1] >> 1) | ((i & 1) * lim_2);
}
```

现在我们可以写出非递归版的 FFT。

```cpp
void FFT(Comp *f, int n, int type) {
    for (int i = 0; i < n; ++i) {
        if (i < rev[i]) {
            swap(f[i], f[rev[i]]);
        }
    }
    for (int h = 2; h <= n; h <<= 1) {
        Comp step(cos(2 * PI / h), sin(2 * PI * type / h));
        for (int j = 0; j < n; j += h) {
            Comp cur(1, 0);
            for (int k = j; k < j + h / 2; k++) {
                Comp f1 = f[k], f2 = cur * f[k + h / 2];
                f[k] = f1 +  f2;
                f[k + h / 2] = f1 - f2;
                cur = cur * step;
            }
        }
    }
    if (type == 1)
        return;
    for (int i = 0; i < n; i++)
        f[i].x /= n, f[i].y /= n;
}
```

## NTT

前置知识：数论基础（整除，同余）。

用 `double` 去实现整数的乘法是很不优美的，精度、速度都很成问题。实际上，我们可以仅在整数下进行运算。

### 原根

我们本质上用到的单位原根 $\omega_n$ 的两个性质是：

- $\omega_{n}^{n} = 1$。
- $\omega_{2n}^{n} = -1$。

可以联想到模 $p$ 剩余类域 $\mathbb{Z}_p$：其中的元素是 $\\{0,1,\cdots,p-1\\}$，其上的运算都是模 $p$ 的。由于 Fermat 小定理 

{{< display-math >}}
a^{\varphi(p)} = a^{p-1} \equiv 1
{{< /display-math >}}

即从另一个角度说，$p-1$ 个正整数都是同余方程 $x^{p-1} \equiv 1$ 的解。

它和单位根有很相似的形式，直觉上 $\mathbb{Z}_p$ 也存在类似单位原根的特殊数字。下面我们在 $\mathbb{Z}_p$ 上讨论，尝试证明这个数字存在。

定义正整数 $a \in \mathbb{Z}_p$ 的阶 $\delta_p(a)$ 为最小的 $r$ 使得 $a^r \equiv 1$。由 Fermat 小定理 $a^{\varphi(p)} \equiv 1$，因此 $a$ 的阶一定存在且有 $\delta_p(a) \mid \varphi(p)$。可以证明

{{< display-math >}}
a,a^2,\cdots a^{\delta_p(a)} \tag{1}
{{< /display-math >}}

在模 $p$ 下余数互不相同。由 Lagrange 定理，$x^{\delta_p(a)} \equiv 1$ 的解至多有 $\delta_p(a)$ 个，恰是 $(1)$ 中所展示的。

通过整除的性质，可以想到只有 $i \bot \delta_p(a)$ 才有 $\delta_p(a^i) = \delta_p(a)$，即 $a$ 总是附带着 

{{< display-math >}}
\sum_{i=1}^{\delta_p(a)} [\gcd(i, \delta_p(a)) = 1] = \varphi(\delta_p(a))
{{< /display-math >}}

个阶相同的东西。因此阶为 $\delta_p(a)$ 的数恰有 $\varphi(\delta_p(a))$ 个。

因为每个正整数都有唯一确定的阶，不妨假设对于所有 $d \mid \varphi(p)$，阶 $d$ 都存在 $\varphi(d)$ 个对应的整数，统计整数个数

{{< display-math >}}
\sum_{d \mid \varphi(p)} \varphi(d) = \varphi(p) = p - 1
{{< /display-math >}}

恰为 $\mathbb{Z}_p$ 全部正整数的个数，因此假设成立，也就存在 $a$ 使得 $\delta_p(a) = p-1$。

我们称这个 $a$ 是模 $p$ 下的一个原根，常用字母 $g$ 表示。

### 快速数论变换

尽可能提取 $p - 1$ 的因子 $2$ 有

{{< display-math >}}
p = N q + 1, N = 2^m
{{< /display-math >}}

设 $\mathbb{Z}_p$ 的一个原根 $g$，将 $g_N \equiv g^q$ 看作 $\omega_n$ 的等价。利用二次剩余的知识不难得到 $g_N^N \equiv 1$ 和 $g_N^{N/2} \equiv -1$。 

常见的有

{{< display-math >}}
\begin{aligned}
p = 1004535809 = 479 \times 2^{21} + 1&, g = 3 \\
p = 998244353 = 7 \times 17 \times 2^{23} + 1&, g = 3
\end{aligned}
{{< /display-math >}}

类似的，我们可以写出程序

```cpp
void NTT(ll *f, int n, int type) {
    for (int i = 0; i < n; ++i) {
        if (i < rev[i]) {
            swap(f[i], f[rev[i]]);
        }
    }
    for (int h = 2; h <= n; h <<= 1) {
        ll tg = type == 1 ? 3 : g_inv;
        ll gn = qpow(tg, (mod - 1) / h);
        for (int j = 0; j < n; j += h) {
            ll g = 1;
            for (int k = j; k < j + h / 2; k++) {
                ll f1 = f[k], f2 = g * f[k + h / 2] % mod;
                f[k] = mo(f1 + f2);
                f[k + h / 2] = mo(f1 - f2);
                g = g * gn % mod;
            }
        }
    }
    if (type == 1)
        return;
    ll lim_inv = inv(n);
    for (int i = 0; i < n; i++)
        f[i] = f[i] * lim_inv % mod;
}
```

## 应用

### FFT P3803 多项式乘法

实战一下：[P3803 多项式乘法](https://www.luogu.com.cn/problem/P3803)。

我们的计算步骤是：

```cpp
FFT(F, lim, 1);
FFT(G, lim, 1);
for (int i = 0; i <= lim; i++)
    F[i] = F[i] * G[i];
FFT(F, lim, -1);
```

实际上，我们并不用三次 FFT，两次足以。注意到若把 $F(x)$ 放在实部而 $G(x)$ 放在虚部

{{< display-math >}}
(F + iG)^2 = (F^2-G^2) + 2iFG
{{< /display-math >}}

平方之后虚部恰是答案。

这里展示全部的代码，帮助大家理解。

{{< fold summary="FFT 模板（P3803 多项式乘法）" >}}
```cpp
const double PI = acos(-1.0);

const int MAXN = 4e6 + 10;

struct Comp {
    double x, y;
    Comp(double xx = 0, double yy = 0) {
        x = xx, y = yy;
    }
    Comp operator+(Comp c) {
        return Comp(x + c.x, y + c.y);
    }
    Comp operator-(Comp c) {
        return Comp(x - c.x, y - c.y);
    }
    Comp operator*(Comp c) {
        double tx = x * c.x - y * c.y;
        double ty = x * c.y + y * c.x;
        return Comp(tx, ty);
    }
};

Comp ff[MAXN];
int rev[MAXN];

void FFT(Comp *f, int n, int type) {
    for (int i = 0; i < n; ++i) {
        if (i < rev[i]) {
            swap(f[i], f[rev[i]]);
        }
    }
    for (int h = 2; h <= n; h <<= 1) {
        Comp step(cos(2 * PI / h), sin(2 * PI * type / h));
        for (int j = 0; j < n; j += h) {
            Comp cur(1, 0);
            for (int k = j; k < j + h / 2; k++) {
                Comp f1 = f[k], f2 = f[k + h / 2];
                f[k] = f1 + cur * f2;
                f[k + h / 2] = f1 - cur * f2;
                cur = cur * step;
            }
        }
    }
    if (type == 1)  return;
    for (int i = 0; i < n; i++)
        f[i].x /= n, f[i].y /= n;
}

int main() {
    int n = rr(), m = rr();
    for (int i = 0; i <= n; i++)
        ff[i].x = rr();
    for (int i = 0; i <= m; i++)
        ff[i].y = rr();

    int lim = 1, lim_2;
    while (lim <= n + m)
        lim <<= 1;
    lim_2 = lim >> 1;
    for (int i = 0; i < lim; ++i)
        rev[i] = (rev[i >> 1] >> 1) | ((i & 1) * lim_2);

    FFT(ff, lim, 1);

    for (int i = 0; i <= lim; i++)
        ff[i] = ff[i] * ff[i];

    FFT(ff, lim, -1);
    
    for (int i = 0; i <= m + n; i++)
        printf("%d ", int(ff[i].y / 2 + 0.5));
    return 0;
}
```
{{< /fold >}}

### NTT P3803 多项式乘法

NTT 再来一遍。

{{< fold summary="NTT 模板（P3803 多项式乘法）" >}}
```cpp
const ll mod = 998244353, g = 3;
const ll MAXN = 4e6 + 10;

ll qpow(ll a, ll b, ll p = mod) {
    ll ret = p != 1;
    for (; b; b >>= 1) {
        if (b & 1)
            ret = a * ret % p;
        a = a * a % p;
    }
    return ret;
}

ll inv(ll a) {
    return qpow(a, mod - 2);
}

ll mo(ll n) {
    return (n + mod) % mod;
}

const ll g_inv = inv(g);

ll ff[MAXN], gg[MAXN];
int rev[MAXN];

void NTT(ll *f, int n, int type) {
    for (int i = 0; i < n; ++i) {
        if (i < rev[i]) {
            swap(f[i], f[rev[i]]);
        }
    }
    for (int h = 2; h <= n; h <<= 1) {
        ll tg = type == 1 ? 3 : g_inv;
        ll gn = qpow(tg, (mod - 1) / h);
        for (int j = 0; j < n; j += h) {
            ll g = 1;
            for (int k = j; k < j + h / 2; k++) {
                ll f1 = f[k], f2 = g * f[k + h / 2] % mod;
                f[k] = mo(f1 + f2);
                f[k + h / 2] = mo(f1 - f2);
                g = g * gn % mod;
            }
        }
    }
    if (type == 1)
        return;
    ll lim_inv = inv(n);
    for (int i = 0; i < n; i++)
        f[i] = f[i] * lim_inv % mod;
}

int main() {
    int n = rr(), m = rr();
    for (int i = 0; i <= n; i++)
        ff[i] = rr();
    for (int i = 0; i <= m; i++)
        gg[i] = rr();

    int lim = 1, lim_2;
    while (lim <= n + m)
        lim <<= 1;
    lim_2 = lim >> 1;
    for (int i = 0; i < lim; ++i)
        rev[i] = (rev[i >> 1] >> 1) | ((i & 1) * lim_2);

    NTT(ff, lim, 1);
    NTT(gg, lim, 1);

    for (int i = 0; i <= lim; i++)
        ff[i] = ff[i] * gg[i];

    NTT(ff, lim, -1);

    for (int i = 0; i <= m + n; i++)
        printf("%lld ", ff[i]);
    return 0;
}
```
{{< /fold >}}
