class Node {
    Node node[] = new Node[26];
    boolean eow;

    public boolean contains(char c){
        return node[c - 'a'] != null;
    }

    public Node get(char c){
        return node[c - 'a'];
    }

    public void put(char c, Node n){
        node[c-'a'] = n;
    }
}

class Solution {
    HashSet<String> output = new HashSet<>();
    public Node root;

    public void insert(String s){
        Node temp = root;
        for(char c: s.toCharArray()){
            if(!temp.contains(c)){
                temp.put(c, new Node());
            }
            temp = temp.get(c);
        }
        temp.eow = true;
    }

    public boolean search(String word){
        Node n = traverse(word);
        return n != null && n.eow;
    }

    public Node traverse(String word){
        Node node = root;
        for (char c: word.toCharArray()){
            if (!node.contains(c)){
                return null;
            }
            node = node.get(c);
        }
        return node;
    }


    public List<String> findWords(char[][] board, String[] words) {
        root = new Node();
        // create trie for words string
        for(String s: words){
            insert(s);
        }

        int n = board.length;
        int m = board[0].length;

        // do dfs on matrix
        for(int i=0;i<board.length;i++){
            for(int j=0;j<board[0].length;j++){
                dfs(board,i,j,n,m,root, board[i][j]+"");
            }
        }

        List<String> out = new ArrayList<>(output);

        return out;


    }

    public void dfs(char[][] board, int i, int j, int n, int m, Node root, String s){

        if(board[i][j] == '*' || !root.contains(board[i][j]))
            return;
        
        root = root.get(board[i][j]);
        
        if(root.eow){
            output.add(s);
        }

        int[] r = {-1,0,1,0};
        int[] c = { 0,-1,0,1};

        for(int k =0;k<4;k++){
            int row = i + r[k];
            int col = j + c[k];

            if(row >= 0 && row < n && col >= 0 && col < m && board[row][col] != '*'){
                char ch = board[i][j];
                board[i][j] = '*';
                if(root.contains(board[row][col]))
                {
                    dfs(board,row,col,n,m,root,s+board[row][col]+"");
                }
                board[i][j] = ch;
            }
        }

    }
}
