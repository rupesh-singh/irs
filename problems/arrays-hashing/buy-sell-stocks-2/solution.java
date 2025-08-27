class Solution {
    public int maxProfit(int[] prices) {
        int ans = 0;
        int buy = prices[0];

        for(int i=1;i<prices.length;i++){
            int profit = prices[i] - buy;
            if(profit > 0){
                ans = ans + profit;
                buy = prices[i];              
            }
            else
                buy = Math.min(buy,prices[i]); 
        }
        return ans;
    }
}