class Solution {
    public int[] smallestRange(List<List<Integer>> nums) {
        int currMax = Integer.MIN_VALUE;
        PriorityQueue<int[]> pq = new PriorityQueue<>((a,b) -> a[0] - b[0]);
        for(int i=0;i<nums.size();i++){
            currMax = Math.max(currMax,nums.get(i).get(0));
            pq.add(new int[]{nums.get(i).get(0),i,0});
        }

        // Track the smallest range
        int[] smallRange = new int[]{0, Integer.MAX_VALUE};

        while(!pq.isEmpty()){            
            int[] curr = pq.remove();
            int currVal = curr[0], currList = curr[1], eleIdx = curr[2];
            
            if(currMax - currVal < smallRange[1] - smallRange[0]){
                smallRange[0] = currVal;
                smallRange[1] = currMax;
            }

            if(eleIdx + 1 < nums.get(currList).size()){
                int nextVal = nums.get(currList).get(eleIdx + 1);
                pq.add(new int[]{nextVal,currList,eleIdx + 1});
                currMax = Math.max(currMax,nextVal);
            }
            else{
                break;
            }
        }

        return smallRange;
        
    }
}

/*

N -> Number of all elements combined
// O(N * K (number of arrays))


        int n = nums.size();
        int[] ptr = new int[n];
        int left = Integer.MAX_VALUE, right = Integer.MIN_VALUE;
        for(int i=0;i<n;i++){
            left = Math.min(left,nums.get(i).get(0));
            right = Math.max(right,nums.get(i).get(0));
        }
        while(true){
            int min = Integer.MAX_VALUE, max = Integer.MIN_VALUE;
            int idx= -1;
            for(int i=0;i<n;i++){
                List<Integer> temp = nums.get(i);
                if(ptr[i] < temp.size()){
                    if(min > temp.get(ptr[i])){
                        min = temp.get(ptr[i]);
                        idx = i;
                    }
                    max = Math.max(max,temp.get(ptr[i]));
                }
            }

            if(idx == -1)
                break;

            if(right - left > max - min ){
                left = min;
                right = max;
            }

            ptr[idx]++;

            if(ptr[idx] == nums.get(idx).size())
                break;

        }


*/