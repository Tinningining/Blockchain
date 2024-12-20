include "./mimc.circom";

/*
 * IfThenElse sets `out` to `true_value` if `condition` is 1 and `out` to
 * `false_value` if `condition` is 0.
 *
 * It enforces that `condition` is 0 or 1.
 *
 */
template IfThenElse() {
    signal input condition;
    signal input true_value;
    signal input false_value;
    signal output out;

    // TODO
    // Hint: You will need a helper signal...

    condition * (1 - condition) === 0; // 保证 condition 为 0 或 1
    signal intermediate; // 使用中间信号来存储计算结果

    // 计算公式: out = condition * true_value + (1-condition) * false_value
    intermediate <== condition * (true_value - false_value);
    out <== intermediate + false_value;
}

/*
 * SelectiveSwitch takes two data inputs (`in0`, `in1`) and produces two ouputs.
 * If the "select" (`s`) input is 1, then it inverts the order of the inputs
 * in the ouput. If `s` is 0, then it preserves the order.
 *
 * It enforces that `s` is 0 or 1.
 */
template SelectiveSwitch() {
    signal input in0;
    signal input in1;
    signal input s;
    signal output out0;
    signal output out1;

    // TODO

    // 创建两个 IfThenElse 组件
    component if0 = IfThenElse();
    component if1 = IfThenElse();
    
    // 设置第一个 IfThenElse 的输入
    if0.condition <== s;
    if0.true_value <== in1;  // 如果 s=1，输出 in1
    if0.false_value <== in0; // 如果 s=0，输出 in0
    
    // 设置第二个 IfThenElse 的输入
    if1.condition <== s;
    if1.true_value <== in0;  // 如果 s=1，输出 in0
    if1.false_value <== in1; // 如果 s=0，输出 in1
    
    // 连接输出
    out0 <== if0.out;
    out1 <== if1.out;
}

/*
 * Verifies the presence of H(`nullifier`, `nonce`) in the tree of depth
 * `depth`, summarized by `digest`.
 * This presence is witnessed by a Merle proof provided as
 * the additional inputs `sibling` and `direction`, 
 * which have the following meaning:
 *   sibling[i]: the sibling of the node on the path to this coin
 *               at the i'th level from the bottom.
 *   direction[i]: "0" or "1" indicating whether that sibling is on the left.
 *       The "sibling" hashes correspond directly to the siblings in the
 *       SparseMerkleTree path.
 *       The "direction" keys the boolean directions from the SparseMerkleTree
 *       path, casted to string-represented integers ("0" or "1").
 */
template Spend(depth) {
    signal input digest;
    signal input nullifier;
    signal private input nonce;
    signal private input sibling[depth];
    signal private input direction[depth];

    // TODO

    // 计算叶子节点的哈希值（使用 Mimc2）
    component leafHasher = Mimc2();
    leafHasher.in0 <== nullifier;
    leafHasher.in1 <== nonce;
    
    // 用于存储每一层的计算结果
    signal intermediate[depth + 1];
    intermediate[0] <== leafHasher.out;
    
    // 为每一层创建选择开关和哈希组件
    component switches[depth];
    component hashers[depth];
    
    // 从底向上计算 Merkle 路径
    for (var i = 0; i < depth; i++) {
        // 使用 SelectiveSwitch 来决定输入顺序
        switches[i] = SelectiveSwitch();
        switches[i].in0 <== intermediate[i];
        switches[i].in1 <== sibling[i];
        switches[i].s <== direction[i];
        
        // 计算这一层的哈希值
        hashers[i] = Mimc2();
        hashers[i].in0 <== switches[i].out0;  // 左输入
        hashers[i].in1 <== switches[i].out1;  // 右输入
        
        // 存储这一层的计算结果
        intermediate[i + 1] <== hashers[i].out;
    }
    
    // 验证计算出的根哈希值与输入的 digest 相等
    digest === intermediate[depth];
}
