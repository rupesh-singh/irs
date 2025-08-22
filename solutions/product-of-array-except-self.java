class Solution {
    public int[] productExceptSelf(int[] nums) {
        int[] output = new int[nums.length];
        int left = 1;
        for(int i=0;i<nums.length;i++){
            left = (i == 0) ? left : left * nums[i-1];
            output[i] = left; 
        }
        
        for(int a: output){
            System.out.print(a+" ");
        }

        int right = 1;
        for(int i = nums.length-1;i>=0;i--){
            right = (i+1 == nums.length) ? right : right * nums[i+1];
            output[i] = output[i] * right;
              
        }

        return output;
    }
}