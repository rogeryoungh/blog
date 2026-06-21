---
author: "rogeryoungh"
title: "满二叉树的非递归 DFS 序遍历"
pubDate: "2024-01-12"
description: "神奇的位运算"
---

[CDQ 分治](https://oi-wiki.org/misc/cdq-divide/) 是一种分治合并贡献的思想，主要是在递归树上遍历。半在线卷积算法其中就有 CDQ 分治的思想，而且其递归树是满二叉树。

很久以前造半在线卷积的时候，为了让分治与数据流解偶，想办法用位运算 [改造成 next 形式](https://www.luogu.com.cn/blog/rogeryoungh/ban-zai-xian-juan-ji-di-shi-xian)。[@HolyK](https://blog.asukakyle.top/) 似乎更早的注意到这一点（原博客好像消失了），并总结出相当一部分的 CDQ 都可以应用这种技巧。

考研学到二叉树时又捡起这个想法，半在线卷积只是中序遍历，其他序能不能也这样做呢？

本文主要总结了满二叉树的非递归实现，即需要保证 $n$ 具有 $2^k$ 的形式。

## BFS 序

BFS 序即层序遍历，大家应该比较熟悉了。FFT 的迭代版一般用这个。

```cpp
void levelorder1(int n) { // 自底向上
  for (int l = 1; l <= n; l *= 2) {
    for (int i = 0; i < n; i += l) {
      std::printf("[%d, %d)\t\n", i, i + l);
    }
  }
}

void levelorder2(int n) { // 自顶向下
  for (int l = n; l >= 1; l /= 2) {
    for (int i = 0; i < n; i += l) {
      std::printf("[%d, %d)\t\n", i, i + l);
    }
  }
}
```

## DFS 序

DFS 序有三种：

- 先序遍历：根左右
- 中序遍历：左根右
- 后序遍历：左右根

### 先序遍历

注意到当前点的 lowbit 指示了其作为左边界的最大覆盖区间。

```cpp
void preorder(int n) { // 根左右
  for (int i = 0; i < n; ++i) {
    int u = i == 0 ? n : (i & -i);
    for (; u > 0; u /= 2) {
      std::printf("[%d, %d)\n", i, i + u);
    }
  }
}
```

### 中序遍历

注意到当前点的 lowbit 指示了其左右范围。

```cpp
void inorder(int n) { // 左根右
  for (int i = 1; i < n; ++i) {
    int u = i & -i;
    if (u == 1) {
      std::printf("[%d, %d)\n", i - 1, i);
      std::printf("[%d, %d)\n", i - u, i + u);
      std::printf("[%d, %d)\n", i, i + 1);
    } else {
      std::printf("[%d, %d)\n", i - u, i + u);
    }
  }
}
```

### 后序遍历

后序遍历直接测试即可。

```cpp
void postorder(int n) { // 左右根
  for (int i = 1; i <= n; ++i) {
    int u = 1;
    while (true) {
      std::printf("[%d, %d)\n", i - u, i);
      if (u & i)
        break;
      u *= 2;
    }
  }
}
```

## 最低步长

有时候我们需要做类似循环展开的优化，加入了最低步长的控制。

### 先序遍历（step）

```cpp
void preorder(int n, int step = 1) { // 根左右
  for (int i = 0; i < n; i += step) {
    int u = i == 0 ? n : (i & -i);
    for (; u >= step; u /= 2) {
      std::printf("[%d, %d)\n", i, i + u);
    }
  }
}
```

### 中序遍历（step）

```cpp
void inorder(int n, int step = 1) { // 左根右
  for (int i = step; i < n; i += step) {
    int l = i & -i;
    if (l == step) {
      std::printf("[%d, %d)\n", i - step, i);
      std::printf("[%d, %d)\n", i - l, i + l);
      std::printf("[%d, %d)\n", i, i + step);
    } else {
      std::printf("[%d, %d)\n", i - l, i + l);
    }
  }
}
```

### 后序遍历（step）

```cpp
void postorder(int n, int step = 1) { // 左右根
  for (int i = step; i <= n; i += step) {
    int l = step;
    while (true) {
      std::printf("[%d, %d)\n", i - l, i);
      if (l & i)
        break;
      l *= 2;
    }
  }
}
```

## 后记

不知道能不能整出来非迭代的 DFS 序 FFT。
