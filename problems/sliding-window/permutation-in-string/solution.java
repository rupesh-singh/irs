class Solution {
    public boolean checkInclusion(String s1, String s2) {

        if(s1.length() > s2.length())
            return false;
        
        int[] h1 = new int[26];
        for(int i=0;i<s1.length();i++)
            h1[s1.charAt(i)-'a']++;

        int i=0,j=0;

        while(j < s2.length()){
            int[] h2 = new int[26];
            for(int k=i;k<=j;k++) 
                h2[s2.charAt(k)-'a']++;

            if(match(h1,h2)){
                return true;
            }
            else{
                i++;
                j = i + s1.length() - 1;
            }
        }
        return false;
    }

    public boolean match(int[] h1, int[] h2){
        for(int i=0;i<26;i++){
            if(h1[i] != h2[i])
                return false;
        }
        return true;
    }
}