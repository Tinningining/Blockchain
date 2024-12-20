const { docopt } = require("docopt");
const { mimc2 } = require("./mimc.js");
const { SparseMerkleTree } = require("./sparse_merkle_tree.js");
const fs = require("fs");
const doc = `Usage:
  compute_spend_inputs.js [options] <depth> <transcript> <nullifier>
  compute_spend_inputs.js -h | --help

Options:
  -o <file>     name of the created witness file [default: input.json]
  -h --help     Print this message

Arguments:
   <depth>       The number of non-root layers in the merkle tree.
   <transcript>  The file containing transcript of all coins.
                 A file with a line for each coin.
                 Each coin is either a single number (the coin
                 itself) or it can be two space-separated number, which are, in
                 order, the nullifier and the nonce for the coin.

                 Example:

                     1839475893
                     1984375234 2983475298
                     3489725451 9834572345
                     3452345234

   <nullifier>   The nullifier to print a witness of validity for.
                 Must be present in the transcript.
`

/*
 * Computes inputs to the Spend circuit.
 *
 * Inputs:
 *   depth: the depth of the merkle tree being used.
 *   transcript: A list of all coins added to the tree.
 *               Each item is an array.
 *               If the array hash one element, then that element is the coin.
 *               Otherwise the array will have two elements, which are, in order:
 *                 the nullifier and
 *                 the nonce
 *               This list will contain **no** duplicate nullifiers or coins.
 *   nullifier: The nullifier to print inputs to validity verifier for.
 *              This nullifier will be one of the nullifiers in the transcript.
 *
 * Return:
 *   an object of the form:
 * {
 *   "digest"            : ...,
 *   "nullifier"         : ...,
 *   "nonce"             : ...,
 *   "sibling[0]"        : ...,
 *   "sibling[1]"        : ...,
 *      ...
 *   "sibling[depth-1]"  : ...,
 *   "direction[0]"      : ...,
 *   "direction[1]"      : ...,
 *      ...
 *   "direction[depth-1]": ...,
 * }
 * where each ... is a string-represented field element (number)
 * notes about each:
 *   "digest": the digest for the whole tree after the transcript is
 *                  applied.
 *   "nullifier": the nullifier for the coin being spent.
 *   "nonce": the nonce for that coin
 *   "sibling[i]": the sibling of the node on the path to this coin
 *                 at the i'th level from the bottom.
 *   "direction[i]": "0" or "1" indicating whether that sibling is on the left.
 *       The "sibling" hashes correspond directly to the siblings in the
 *       SparseMerkleTree path.
 *       The "direction" keys the boolean directions from the SparseMerkleTree
 *       path, casted to string-represented integers ("0" or "1").
 */
function computeInput(depth, transcript, nullifier) {
    // TODO
    // 创建指定深度的稀疏Merkle树
    const tree = new SparseMerkleTree(depth);
    let targetNonce = null;
    
    // 处理所有交易记录以构建Merkle树
    for (let item of transcript) {
        if (item.length === 1) {
            // 如果只有一个值,那就是coin本身
            const coin = item[0]; 
            tree.insert(coin);
        } else {
            // 如果有两个值,分别是nullifier和nonce
            const [currentNullifier, nonce] = item;
            // 计算coin的哈希值并插入树中
            const coin = mimc2(currentNullifier, nonce);
            tree.insert(coin);
            
            // 如果这是我们要找的nullifier,记录对应的nonce
            if (currentNullifier === nullifier) {
                targetNonce = nonce;
            }
        }
    }
    
    // 确保找到了目标nullifier 
    if (targetNonce === null) {
        throw new Error(`Nullifier ${nullifier} not found in transcript`);
    }
    
    // 计算目标coin的哈希值
    const targetCoin = mimc2(nullifier, targetNonce);
    
    // 获取Merkle路径 - 返回[sibling, direction]对的数组
    const path = tree.path(targetCoin);
    
    // 构建输出对象
    const output = {
        "digest": tree.digest,
        "nullifier": nullifier.toString(),
        "nonce": targetNonce.toString()
    };
    
    // 添加siblings和directions
    // path数组包含[sibling, direction]对
    for (let i = 0; i < depth; i++) {
        output[`sibling[${i}]`] = path[i][0];  // sibling是第一个元素
        output[`direction[${i}]`] = path[i][1] ? "1" : "0";  // direction是第二个元素
    }
    
    return output;
    // return {};
}

module.exports = { computeInput };

// If we're not being imported
if (!module.parent) {
    const args = docopt(doc);
    const transcript =
        fs.readFileSync(args['<transcript>'], { encoding: 'utf8' } )
        .split(/\r?\n/)
        .filter(l => l.length > 0)
        .map(l => l.split(/\s+/));
    const depth = parseInt(args['<depth>']);
    const nullifier = args['<nullifier>'];
    const input = computeInput(depth, transcript, nullifier);
    // fs.writeFileSync(args['-o'], JSON.stringify(input) + "\n");
    fs.writeFileSync(args['-o'], JSON.stringify(input, null, 2) + "\n");
}
