class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> hs = new HashSet<>();
        for(int a: nums){
            hs.add(a);
        }

        int max =0;
        
        for(int n: hs){
            if(!hs.contains(n-1)){
                int currStreak = n + 1;
                
                while(hs.contains(currStreak)){
                    currStreak++;
                }
                
                max = Math.max(max,currStreak - n);
            }
        }
        
        return max;
    }
}