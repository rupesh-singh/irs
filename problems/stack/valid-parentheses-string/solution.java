class Solution {
    public boolean checkValidString(String s) {
        Stack<Integer> leftpar = new Stack<>();
        Stack<Integer> stars = new Stack<>();

        for(int i=0;i<s.length();i++){
            if(s.charAt(i) == '(')
                leftpar.push(i);
            
            else if(s.charAt(i) == '*')
                stars.push(i);

            else {
                if(!leftpar.isEmpty())
                    leftpar.pop();
                else if(!stars.isEmpty())
                    stars.pop();
                else
                    return false;
            }
        }

        System.out.println(leftpar);

        while(!leftpar.isEmpty() && !stars.isEmpty()){
            if(leftpar.pop() > stars.pop())
                return false;  // if ( comes after *
        }

        return leftpar.isEmpty();


    }
}