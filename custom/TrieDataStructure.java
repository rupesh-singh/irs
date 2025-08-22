import java.util.Stack;
// This class represents single Node in Trie Data Structure
class Node{
    Node links[] = new Node[26];
    boolean endOfTheWord;

    public Node(){
    }

    public boolean containsNode(char ch){
        return links[ch-'a'] != null;
    }

    public Node get(char ch){
        return links[ch - 'a'];
    }

    public void put(char ch, Node n){
        links[ch - 'a'] = n;
    }

    public void setEndOfTheWord(boolean endOfTheWord) {
        this.endOfTheWord = endOfTheWord;
    }

    public boolean getEndOfTheWord(){
        return this.endOfTheWord;
    }
}

class pair {
    Node node;
    String string;

    pair(Node n, String s){
        this.node = n;
        this.string = s;
    }
}


class TrieNode {
    public static Node root;

    public TrieNode(){
        root = new Node();
        root.setEndOfTheWord(false);
    }

    public void Insert(String word){
        Node node = root;
        for (char c: word.toCharArray()){
            if (!node.containsNode(c)){
               node.put(c,new Node());
            }
            node = node.get(c);
        }
        node.setEndOfTheWord(true);
    }

    public boolean search(String word){
        Node n = traverse(word);
        return n != null && n.getEndOfTheWord();
    }

    public boolean contains(String prefix){
        Node n = traverse(prefix);
        return n != null;
    }

    public boolean wildCardSearch(String word){
        Node temp = root;
        return searchWildCard(temp,word);
    }

    public boolean searchWildCard(Node temp, String word){
        for(int i=0;i<word.length();i++){
            char c = word.charAt(i);
            if(c == '.'){
                for( Node n : temp.links){
                    if( n != null && searchWildCard(n,word.substring(i+1)))
                        return true;
                    return false;
                }
            }
            else if(temp.containsNode(c)){
                temp = temp.get(c);
            }
            else {
                return false;
            }

        }
        return temp != null && temp.endOfTheWord;
    }

    public Node traverse(String word){
        Node node = root;
        for (char c: word.toCharArray()){
            if (!node.containsNode(c)){
                return null;
            }
            node = node.get(c);
        }
        return node;
    }

    public int printTrie(){
        Stack<pair> st = new Stack<>();
        pair pairw = new pair(root,"");
        st.add(pairw);
        StringBuilder sb = new StringBuilder();
        int count=0;
        while(!st.isEmpty()){
            pair n = st.pop();
            if(n.node.getEndOfTheWord()){
                count++;
                System.out.println(count+": "+n.string);
            }
            for(int i=0;i<26;i++){
                char c = (char) ('a' + i);
                if(n.node.containsNode(c)) {
                    st.push(new pair(n.node.get(c),n.string+c));
                }
            }
        }
        return count;
    }
}

/*

1. count words with starts with
2. count words with ends with
3. Longest word with all prefix present in trie.
4.

 */

public class TrieDataStructure {

    public static void main(String[] args) {
        TrieNode trieNode = new TrieNode();
        trieNode.Insert("bad");
        trieNode.Insert("dad");
        trieNode.Insert("mad");
        trieNode.wildCardSearch("bad");
        trieNode.wildCardSearch(".ad");
//        System.out.println(trieNode.contains("app"));
//        System.out.println(trieNode.search("apple"));
//        System.out.println(trieNode.search("application"));
        System.out.println(trieNode.printTrie());
    }
}

