class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        List<Integer> output = new ArrayList<>();
        int n = nums.length;

        Deque<Integer> dq = new ArrayDeque<>();

        // maintain a decreasing deque of size k 
        for(int i=0;i<n;i++){

            if(!dq.isEmpty() && dq.peekFirst() <= i - k){
                dq.pollFirst();
            }

            while(!dq.isEmpty() && nums[dq.peekLast()] < nums[i]){
                dq.pollLast();
            }

            dq.offerLast(i);

            if(i>=k-1){
                output.add(nums[dq.peekFirst()]);
            }
        }

        int[] out = new int[output.size()];
        for(int i=0;i<output.size();i++)
            out[i] = output.get(i);
        return out;
        
    }
}

/*

// burte force 


        for(int i=0;i<=n-k;i++){
            int max =Integer.MIN_VALUE;
            for(int j=i;j<i+k;j++){
                //System.out.print(nums[j]+" ");
                max = Math.max(max,nums[j]);
            }
            //System.out.println();
            output.add(max);
        }

// using priorityqueue

        PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());
        int i=0,j=0;

        while(j<n){
            pq.add(nums[j]);
            if((j-i + 1)>=k){
                output.add(pq.peek());
                pq.remove(nums[i]); // remove operation in Heap is O(n) and thus time complexity becomes O(n.k)
                i++;
            }
            j++;
        }



*/
