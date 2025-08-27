class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        HashMap<Integer, Integer> hm = new HashMap<>();
        ArrayList<Integer>[] bucket = new ArrayList[nums.length+1];       
        int[] output = new int[k];

        for(int i: nums){
            if(hm.containsKey(i)){
                hm.put(i, hm.get(i)+1);
            }
            else{
                hm.put(i,1);
            }
        }

        for(int i =0;i<nums.length+1;i++){
            bucket[i]= new ArrayList<Integer>();
        }
        for(Map.Entry<Integer, Integer> map: hm.entrySet()){
            bucket[map.getValue()].add(map.getKey());
        }
        
        System.out.println(Arrays.toString(bucket));
        
        int j=0;
        for(int i=nums.length;i>0;i--){
            if(bucket[i].size()>0){
                for(int a: bucket[i]){
                    output[j] = a;
                    j++;
                }
                if(j>=k){
                    break;
                }
            }

        }

        return output;



    }
}
