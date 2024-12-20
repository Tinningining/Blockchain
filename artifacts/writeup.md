Name: []

## Question 1

In the following code-snippet from `Num2Bits`, it looks like `sum_of_bits`
might be a sum of products of signals, making the subsequent constraint not
rank-1. Explain why `sum_of_bits` is actually a _linear combination_ of
signals.

```
        sum_of_bits += (2 ** i) * bits[i];
```

## Answer 1

在你提供的代码片段中，变量 `sum_of_bits` 通过以下代码行进行累加：

```python
sum_of_bits += (2 ** i) * bits[i]
```

`(2 ** i)`是 2 的 `i` 次方，表示一个标量值，依赖于索引 `i`。`bits[i]`表示一个二进制信号，它位于索引 `i` 的位置。`(2 ** i) * bits[i]`是标量 `(2 ** i)` 和信号 `bits[i]` 的乘积。

`sum_of_bits` 是通过对每个索引 `i` 的 `(2 ** i) * bits[i]` 进行累加得到的。这代表了二进制数中第 `i` 位的值，乘以对应的权重 `2^i`。因此，`sum_of_bits` 实际上是一个 **加权和**，每一位 `bits[i]` 都乘上了一个对应的 2 的幂，这正是二进制数的表示方式。

在数学上，线性组合指的是一组信号（或变量）和常数的加法，其中每个信号与一个标量系数相乘。在这里，`bits[i]` 是信号，`2^i` 是系数，所以 `sum_of_bits` 就是这些信号的线性组合。


## Question 2

Explain, in your own words, the meaning of the `<==` operator.

## Answer 2

`<==`是一个特殊的赋值操作符，用于同时执行赋值和约束。在 `SmallOdd` 模板中，`binaryDecomposition.in <== in;` 这行代码首先将输入信号 `in` 的值传递给子电路  `binaryDecomposition` 的输入信号 `in`。

不仅仅是赋值,通过 `<==` 操作符，Circom 会自动生成一个约束，确保 `binaryDecomposition.in` 等于 `in`，也就是说，子电路的输入必须与外部输入一致。这种设计使得电路更简洁和直观，避免了冗余的约束声明。


## Question 3

Suppose you're reading a `circom` program and you see the following:

```
    signal input a;
    signal input b;
    signal input c;
    (a & 1) * b === c;
```

Explain why this is invalid.

## Answer 3

按位与操作 `&` 是针对整数值的操作，通常用于二进制数字之间的运算。在 `circom` 中，`signal` 类型用于表示电路中的信号，更侧重于通过约束来表达逻辑和数学关系，表示某个变量的约束条件或取值范围。

在 `circom` 中，约束通常基于乘法、加法等操作，而不是按位与（`&`）、按位或（`|`）等按位操作。因此，`a & 1` 这种操作在 `circom` 中不被允许。
