---
title: "Block Optimization for Polynomial Newton Iteration"
pubDate: "2022-01-19"
description: "STL is impressive."
---

> Translated by ChatGPT.

Draft...

Semi-online convolution can be multi-ary, so why can't Newton iteration be multi-ary too?

In this post, we use blocking to obtain sqrt(8E), inv(10E), div(10E), and exp(14E), which improves the constants compared with previous methods.

This post can be viewed as a translation of [Faster algorithms for the square root and reciprocal of power series](https://arxiv.org/abs/0910.1926) and [Faster exponentials of power series](https://arxiv.org/abs/0911.3110). The original papers also contain inv(8.66E) and exp(13E) algorithms, but they are too complicated, so I did not try them.

This is my first time writing such an article, and many parts are probably not standardized. Comments are welcome.

## Blocking principle

For two polynomials $f, g$ of length $mr$, we split $f$ into $r$ blocks, denoted as

$$ f_{[0]}, f_{[1]}, \cdots, f_{[r-1]} $$

Similarly for $g$. To simplify notation, write $X = x^m$.

Their product has some extra terms. Take $r=2$ as an example:

$$
fg = f_{[0]} \ast g_{[0]} + (f_{[0]} \ast g_{[1]} + f_{[1]} \ast g_{[0]}) X + f_{[1]} \ast g_{[1]} X^2
$$

Notice that

$$
(fg)_{[1]} \neq \left(f_{[0]} \ast g_{[1]} + f_{[1]} \ast g_{[0]}\right)  \bmod X
$$

because $f_{[0]} \ast g_{[0]}$ has $2m$ terms and can be folded back through cyclic convolution. Written in full, this is

$$
(fg)_{[1]} = \left(f_{[0]} \ast g_{[1]} + f_{[1]} \ast g_{[0]} + f_{[0]} \ast g_{[0]} \ast X\right) \bmod (X^2 - 1) \bmod X
$$

In general, for the $k$-th block of $fg$, we have

$$
(f g)_{[k]} = \left(\sum_{i=0}^{k} f_{[i]} \ast g_{[k-i]} + \sum_{i=0}^{k-1} f_{[i]} \ast g_{[k-1-i]} \ast X\right) \bmod  (X^2 - 1) \bmod X
$$

So the corresponding computation is

$$
\mathcal{F}_{2m}^{-1}\left(\sum_{i=0}^{k} \mathcal{F}_{2m}(f_{[i]}) \cdot \mathcal{F}_{2m}(g_{[k-i]}) + \sum_{i=0}^{k-1} \mathcal{F}_{2m}(f_{[i]}) \cdot \mathcal{F}_{2m}(g_{[k-1-i]}) \cdot \mathcal{F}_{2m}(X)\right)
$$

And $\mathcal{F}_{2m}(X) = (-1)^j$, so it does not need to be computed. That is, when the DFT of each block has already been computed, we only need one IDFT to compute the $k$-th block.

## Square root $g^2 = f$

This is actually very similar to semi-online convolution, except that relax eventually updates one point, while here an entire block is iterated.

Similar to ordinary Newton iteration, suppose $g_{[0]}, \cdots, g_{[k-1]}$ have already been obtained. Then observe the effect caused by the missing $g_{[k]}$:

$$
\begin{aligned}
(g_{[0]}+ \cdots+ g_{[k-1]} X^{k-1})^2 &= f_{[0]} + \cdots + \psi X^{k} + \cdots \\
(g_{[0]}+ \cdots+ g_{[k]} X^{k})^2 &= f_{[0]} + \cdots + f_{[k]} X^{k} + \cdots
\end{aligned}
$$

Thus

$$
f_{[k]} - \psi = 2 g_{[0]} \ast g_{[k]} \bmod X
$$

The concrete steps are:

0. Given $g_{[0]}$, precompute $h = (g_{[0]})^{-1}$ using any 6E algorithm.
1. Compute $\mathcal{F}_{2m}(h)$, costing 2E.
2. 0. Suppose we are computing the $k$-th block.
   1. Compute $\mathcal{F}_{2m}(g_{[k-1]})$, costing 2E.
   2. Compute $\psi$ using the optimization above, which only needs one IDFT, costing 2E.
   3. Compute $g_{[k]} \gets \frac{1}{2} h \ast (f_{[k]} - \psi) \bmod X$, costing 4E.

In short, according to the estimate in the paper, if we compute by splitting into $r \to \infty$ blocks, the cost is about 8E.

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

Actual testing shows that the iterative version's constant is sensitive to $r$. I suspect this is because the inv cost is too large, and it only gains an advantage when enough $r$ iterations are performed. Recursion is better than iteration in terms of splitting. The number of blocks $r$ does not have to be a power of $2$.

See the [submission](https://www.luogu.com.cn/record/67226751) for the code.

## Reciprocal $f \ast g = 1$

Its block form is

$$
0 - \psi = f_{[0]} \ast g_{[k]} \bmod X
$$

The concrete steps are:

0. Given $g_{[0]}$, and $h = (f_{[0]})^{-1} = g_{[0]}$, no computation is needed.
1. 0. Suppose we are computing the $k$-th block.
   1. Compute $\mathcal{F}_{2m}(g_{[k-1]})$ and $\mathcal{F}_{2m}(f_{[k]})$, costing 4E.
   2. Compute $\psi$, costing 2E.
   3. Compute $g_{[k]} \gets -h \ast \psi \bmod X$, costing 4E.

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

When $r \to \infty$, the cost is about 10E. See the [submission](https://www.luogu.com.cn/record/67337098) for the code.

In the original paper, the polynomial is split into $3s$ blocks. The first block uses the same method, and the latter two blocks reuse computations better, reaching $26/3 = 8.66 \mathsf{E}$. I have not read that part yet; interested readers can try it.

## Quotient $f \ast g = d$

The paper does not include this. I think adding a $d$ on the right side should not affect much, and trying it confirms that it works.

$$
d_{[k]} - \psi = f_{[0]} \ast g_{[k]} \bmod X
$$

Since $d$ does not need DFT, the method is basically the same as reciprocal, so I will not repeat it.

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

When $r \to \infty$, the cost is about 10E. See the [submission](https://www.luogu.com.cn/record/67227138) for the code.

## Exponential $g = e^f$

The exponential is different from the previous ones. Its differential equation $\Delta g = \Delta f \ast g$ contains $g$ on both sides, so it cannot be computed directly.

Similarly, write it in block form:

$$
(\Delta g)_{[k]} - \psi = g_{[k]} \ast (\Delta f)_{[0]} \bmod X
$$

For convenience, define $\Delta_{k}f = X^{-k} \Delta(X^k f)$, so

$$
\Delta (f_{[0]} + f_{[1]} X + \cdots) = (\Delta_0 f_{[0]}) + (\Delta_1 f_{[1]}) + \cdots
$$

Let $u = (g_{[0]})^{-1}$. Notice that

$$
\Delta u = \Delta \exp (-f_{[0]}) = -u \ast \Delta f_{[0]}
$$

Therefore

$$
\begin{aligned}
\phi = u \ast \psi &= u \ast (\Delta g)_{[k]} - u \ast g_{[k]} \ast (\Delta_f)_{[0]}\\
&= u \ast (\Delta g)_{[k]} + g_{[k]} \ast (\Delta u) \\
&= \Delta_{k}(g_{[k]} \ast u \bmod X)
\end{aligned}
$$

Then $g_{[k]}$ can be extracted faster.

The concrete computation:

0. Given $g_{[0]}$.
1. Compute $u = (g_{[0]}) ^ {-1}$ and $\mathcal{F}_{2m}(u)$, costing 6E + 2E.
2. Compute $\mathcal{F}_{2m}((\Delta f)_{[0]})$, costing 2E.
3. 0. Suppose we are computing the $k$-th block.
   1. Compute $\mathcal{F}_{2m}((\Delta f)_{[k]})$ and $\mathcal{F}_{2m} (g_{[k-1]})$, costing 2E + 2E.
   2. Compute $\psi$, costing 2E.
   3. Compute $\phi \gets u \ast \psi$, costing 4E.
   4. Compute $g_{[k]} \gets g_{[0]} \ast (\Delta_{k}^{-1} \phi)$, costing 4E.

When $r \to \infty$, the cost is about 14E. See the [submission](https://www.luogu.com.cn/record/67322636) for the code.

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

In the original paper, splitting into $2s$ blocks reaches 13E. I have not read that part yet; interested readers can try it.

## Refence

https://arxiv.org/abs/0910.1926

https://arxiv.org/abs/0911.3110

https://negiizhao.blog.uoj.ac/blog/4671

https://hly1204.github.io/library/math/formal_power_series/formal_power_series.hpp
