---
title: "多项式牛顿迭代的分块优化"
pubDate: "2022-01-19"
description: "STL 好厉害。"
---

草稿。。。

半在线卷积可以多叉，牛顿迭代怎么就不能多叉呢。

在本文我们利用分块得到了 sqrt(8E)，inv(10E)，div(10E)，exp(14E)，相比以前有了一定的常数提升。

本文可以看作 [Faster algorithms for the square root and reciprocal of power series](https://arxiv.org/abs/0910.1926) 和 [Faster exponentials of power series](https://arxiv.org/abs/0911.3110) 的翻译。原论文还有 inv(8.66E) 和 exp(13E) 的算法，但是过于复杂了，我没有尝试。

初次写文，好多地方不规范，欢迎指教。

## 分块原理

对于两个长为 $mr$ 多项式 $f, g$，我们把 $f$ 分成 $r$ 块，分别记做

$$ f_{[0]}, f_{[1]}, \cdots, f_{[r-1]} $$

对于 $g$ 类似，为了简化描述，我们记 $X = x^m$。

其乘积有一些额外的项，拿 $r=2$ 举例

$$
fg = f_{[0]} \ast g_{[0]} + (f_{[0]} \ast g_{[1]} + f_{[1]} \ast g_{[0]}) X + f_{[1]} \ast g_{[1]} X^2
$$

注意

$$
(fg)_{[1]} \neq \left(f_{[0]} \ast g_{[1]} + f_{[1]} \ast g_{[0]}\right)  \bmod X
$$

因为 $f_{[0]} \ast g_{[0]}$ 是 $2m$ 项的，可以用循环卷积转回去。写全即是

$$
(fg)_{[1]} = \left(f_{[0]} \ast g_{[1]} + f_{[1]} \ast g_{[0]} + f_{[0]} \ast g_{[0]} \ast X\right) \bmod (X^2 - 1) \bmod X
$$

一般的，对于 $fg$ 的第 $k$ 块，有公式

$$
(f g)_{[k]} = \left(\sum_{i=0}^{k} f_{[i]} \ast g_{[k-i]} + \sum_{i=0}^{k-1} f_{[i]} \ast g_{[k-1-i]} \ast X\right) \bmod  (X^2 - 1) \bmod X
$$

所以我们对应的计算过程为

$$
\mathcal{F}_{2m}^{-1}\left(\sum_{i=0}^{k} \mathcal{F}_{2m}(f_{[i]}) \cdot \mathcal{F}_{2m}(g_{[k-i]}) + \sum_{i=0}^{k-1} \mathcal{F}_{2m}(f_{[i]}) \cdot \mathcal{F}_{2m}(g_{[k-1-i]}) \cdot \mathcal{F}_{2m}(X)\right)
$$

而 $\mathcal{F}_{2m}(X) = (-1)^j$，无需计算。即在各块的 DFT 已经计算好的情况下，我们只需要一次 IDFT 就可以算出第 $k$ 块。

## 平方根 $g^2 = f$

这个东西其实和半在线卷积很像，只不过 relax 最后归于一个点，而这里是一整块在迭代。

类似于普通牛顿迭代，假设 $g_{[0]}, \cdots, g_{[k-1]}$ 已经给出，那么观察缺少 $g_{[k]}$ 所造成的影响

$$
\begin{aligned}
(g_{[0]}+ \cdots+ g_{[k-1]} X^{k-1})^2 &= f_{[0]} + \cdots + \psi X^{k} + \cdots \\
(g_{[0]}+ \cdots+ g_{[k]} X^{k})^2 &= f_{[0]} + \cdots + f_{[k]} X^{k} + \cdots
\end{aligned}
$$

即得

$$
f_{[k]} - \psi = 2 g_{[0]} \ast g_{[k]} \bmod X
$$

具体的步骤是

0. 给定 $g_{[0]}$，预计算 $h = (g_{[0]})^{-1}$，可以使用任何 6E 的算法。
1. 计算 $\mathcal{F}_{2m}(h)$，花费 2E。
2. 0. 假设要计算第 $k$ 块。
   1. 计算 $\mathcal{F}_{2m}(g_{[k-1]})$，花费 2E。
   2. 计算 $\psi$，用前述优化只需一次 IDFT，花费 2E。
   3. 计算 $g_{[k]} \gets \frac{1}{2} h \ast (f_{[k]} - \psi) \bmod X$，花费 4E。
   
总之，根据论文估计，若我们通过分成 $r \to \infty$ 块计算，大概开销是 8E。

```cpp
Poly Poly::sqrt() const {
    if (deg() == 1) {
        return {front().sqrt()};
    }
    const int R = 16, iv2 = qpow(2);
    int m = get_lim((deg() - 1) / R + 1);
    Poly x = cut(m).sqrt(), h = x.inv().ntt(m * 2);
    vector<Poly> ng(R);

    for (int k = 1; x.deg() < deg(); k++) {
        ng[k - 1] = x.cut(m, (k - 1) * m).ntt(m * 2);
        Poly psi(m * 2);
        for (int j = 0; j < k; j++) {
            if (j >= 1) {
                for (int i = 0; i < m; i++)
                    psi[i] -= ng[j][i] * (ng[k - j][i] + ng[k - 1 - j][i]);
                for (int i = m; i < m * 2; i++)
                    psi[i] -= ng[j][i] * (ng[k - j][i] - ng[k - 1 - j][i]);
            } else {
                for (int i = 0; i < m; i++)
                    psi[i] -= ng[j][i] * ng[k - 1 - j][i];
                for (int i = m; i < m * 2; i++)
                    psi[i] += ng[j][i] * ng[k - 1 - j][i];
            }
        }
        psi.intt(m * 2).fillZeroH(m * 2);
        for (int j = 0; j < min(m, deg() - m * k); j++)
            psi[j] += (*this)[m * k + j];
        mul(psi, h, m * 2);
        x.redeg((k + 1) * m);
        for (int i = 0; i < m; i++)
            x[m * k + i] = psi[i] * iv2;
    }
    return x.cut(deg());
}
```

实际测试发现，迭代写法常数对 $r$ 敏感，猜测是 inv 开销过大，算足 $r$ 次才有优势，递归在划分上比迭代更好。块数 $r$ 可以不是 $2$ 的幂。

代码请看 [提交](https://www.luogu.com.cn/record/67226751)。

## 倒数 $f \ast g = 1$

其分块形式是

$$
0 - \psi = f_{[0]} \ast g_{[k]} \bmod X
$$

具体的步骤是

0. 给定 $g_{[0]}$，而 $h = (f_{[0]})^{-1} = g_{[0]}$，不用计算。
1. 0. 假设要计算第 $k$ 块。
   1. 计算 $\mathcal{F}_{2m}(g_{[k-1]})$ 和 $\mathcal{F}_{2m}(f_{[k]})$，花费 4E。
   2. 计算 $\psi$，花费 2E。
   3. 计算 $g_{[k]} \gets -h \ast \psi \bmod X$，花费 4E。
   
```cpp
Poly Poly::inv() const { // 10E
    if (deg() == 1) {
        return {front().inv()};
    }
    const int R = 16;
    int m = get_lim((deg() - 1) / R + 1);
    Poly x = cut(m).inv();
    vector<Poly> nf(R), ng(R);
    nf[0] = cut(m).ntt(m * 2);
    for (int k = 1; x.deg() < deg(); k++) {
        nf[k] = cut(m, k * m).ntt(m * 2); // 2E
        ng[k - 1] = x.cut(m, (k - 1) * m).ntt(m * 2); // 2E
        Poly psi(m * 2);
        for (int j = 0; j < k; j++) {
            for (int i = 0; i < m; i++)
                psi[i] -= ng[j][i] * (nf[k - j][i] + nf[k - 1 - j][i]);
            for (int i = m; i < m * 2; i++)
                psi[i] -= ng[j][i] * (nf[k - j][i] - nf[k - 1 - j][i]);
        }
        psi.intt(m * 2).fillZeroH(m * 2); // 2E
        mul(psi, ng[0], m * 2); // 4E
        x.redeg((k + 1) * m);
        for (int i = 0; i < m; i++)
            x[m * k + i] = psi[i];
    }
    return x.cut(deg());
}
```

当 $r \to \infty$ 时，开销大概是 10E。代码请看 [提交](https://www.luogu.com.cn/record/67337098)。

原论文中分成 $3s$ 块，前面一块方法相同，后面两块通过更优的复用做到了 $26/3 = 8.66 \mathsf{E}$。我还没有阅读，感兴趣的可以尝试。

## 商数 $f \ast g = d$

论文里没有这个，我觉得右边加个 $d$ 没啥影响，试了试的确可以。

$$
d_{[k]} - \psi = f_{[0]} \ast g_{[k]} \bmod X
$$

因为 $d$ 不需要做 DFT，故与倒数的方法基本相同，这里不重复了。

```cpp
Poly Poly::div(Poly f) const { // 10E
    if (deg() == 1) {
        return {front() * f[0].inv()};
    }
    f.redeg(deg());
    const int R = 16;
    int m = get_lim((deg() - 1) / R + 1);
    Poly x = cut(m).div(f), h = f.cut(m).inv().ntt(m * 2);

    vector<Poly> nf(R), ng(R);

    nf[0] = f.cut(m).ntt(m * 2);
    for (int k = 1; x.deg() < deg(); k++) {
        nf[k] = f.cut(m, k * m).ntt(m * 2);
        ng[k - 1] = x.cut(m, (k - 1) * m).ntt(m * 2);
        Poly psi(m * 2);
        for (int j = 0; j < k; j++) {
            for (int i = 0; i < m; i++)
                psi[i] -= ng[j][i] * (nf[k - j][i] + nf[k - 1 - j][i]);
            for (int i = m; i < m * 2; i++)
                psi[i] -= ng[j][i] * (nf[k - j][i] - nf[k - 1 - j][i]);
        }
        psi.intt(m * 2).fillZeroH(m * 2);
        for (int j = 0; j < min(m, deg() - m * k); j++)
            psi[j] += (*this)[m * k + j];
        mul(psi, h, m * 2);
        x.redeg((k + 1) * m);
        for (int i = 0; i < m; i++)
            x[m * k + i] = psi[i];
    }
    return x.cut(deg());
}
```

当 $r \to \infty$ 时，开销大概是 10E。代码请看 [提交](https://www.luogu.com.cn/record/67227138)。

## 指数 $g = e^f$

指数与前者不同，其微分方程 $\Delta g = \Delta f \ast g$ 左右都有 $g$，不能直接算。

类似的，写作分块形式

$$
(\Delta g)_{[k]} - \psi = g_{[k]} \ast (\Delta f)_{[0]} \bmod X
$$

为了方便起见，我们记 $\Delta_{k}f = X^{-k} \Delta(X^k f)$，有

$$
\Delta (f_{[0]} + f_{[1]} X + \cdots) = (\Delta_0 f_{[0]}) + (\Delta_1 f_{[1]}) + \cdots
$$

令 $u = (g_{[0]})^{-1}$，注意到

$$
\Delta u = \Delta \exp (-f_{[0]}) = -u \ast \Delta f_{[0]}
$$

因此

$$
\begin{aligned}
\phi = u \ast \psi &= u \ast (\Delta g)_{[k]} - u \ast g_{[k]} \ast (\Delta_f)_{[0]}\\
&= u \ast (\Delta g)_{[k]} + g_{[k]} \ast (\Delta u) \\
&= \Delta_{k}(g_{[k]} \ast u \bmod X)
\end{aligned}
$$

如此就可以更快的取出 $g_{[k]}$ 了。

具体的计算过程：

0. 给定 $g_{[0]}$。
1. 计算 $u = (g_{[0]}) ^ {-1}$ 和 $\mathcal{F}_{2m}(u)$，花费 6E + 2E
2. 计算 $\mathcal{F}_{2m}((\Delta f)_{[0]})$，花费 2E。
3. 0. 假设要计算第 $k$ 块
   1. 计算 $\mathcal{F}_{2m}((\Delta f)_{[k]})$ 和 $\mathcal{F}_{2m} (g_{[k-1]})$，花费 2E + 2E。
   2. 计算 $\psi$，花费 2E。
   3. 计算 $\phi \gets u \ast \psi$，花费 4E。
   4. 计算 $g_{[k]} \gets g_{[0]} \ast (\Delta_{k}^{-1} \phi)$，花费 4E。

当 $r \to \infty$ 时，开销大概是 14E。代码请看 [提交](https://www.luogu.com.cn/record/67322636)。

```cpp
Poly Poly::exp() const { // 14E
    if (deg() == 1) {
        return {1};
    }
    const int S = 16;
    int m = get_lim((deg() - 1) / S + 1);
    Poly x = cut(m).exp(), u = x.inv();
    vector<Poly> nf(S), ng(S);

    Poly df = *this;
    for (int i = 0; i < df.deg(); i++)
        df[i] *= i;
    u.ntt(m * 2);
    nf[0] = df.cut(m).ntt(m * 2);

    for (int k = 1; x.deg() < deg(); k++) {
        nf[k] = df.cut(m, k * m).ntt(m * 2);
        ng[k - 1] = x.cut(m, m * (k - 1)).ntt(m * 2);
        Poly psi(m * 2);
        for (int j = 0; j < k; j++) {
            for (int i = 0; i < m; i++)
                psi[i] += ng[j][i] * (nf[k - j][i] + nf[k - 1 - j][i]);
            for (int i = m; i < m * 2; i++)
                psi[i] += ng[j][i] * (nf[k - j][i] - nf[k - 1 - j][i]);
        }
        psi.intt(m * 2).fillZeroH(m * 2);

        mul(psi, u, m * 2).fillZeroH(m * 2);
        pre_inv(m * (k + 2));
        for (int i = 0; i < m * 2; i++)
            psi[i] *= Inv[m * k + i];
        mul(psi, ng[0], m * 2).fillZeroH(m * 2);
        x.redeg((k + 1) * m);
        for (int i = 0; i < m; i++)
            x[m * k + i] = psi[i];
    }
    return x.cut(deg());
}
```

原论文中分成 $2s$ 块，做到了 13E。我还没有阅读，感兴趣的可以尝试。

## Refence

https://arxiv.org/abs/0910.1926

https://arxiv.org/abs/0911.3110

https://negiizhao.blog.uoj.ac/blog/4671

https://hly1204.github.io/library/math/formal_power_series/formal_power_series.hpp

