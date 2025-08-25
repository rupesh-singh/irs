/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode reverseKGroup(ListNode head, int k) {
        int n = 0;
        ListNode temp = head;
        while(temp != null){
            n++;
            temp = temp.next;
        }

        if(k > n){
            return head;
        }

        int t = n / k;

        ListNode dummy = new ListNode(0);
        dummy.next = head;
        ListNode prevGroup = dummy;


        while(t>0){
           ListNode start = prevGroup.next;  // first node of group
            ListNode curr = start;
            ListNode prev = null;
            ListNode next = null;

            int count = k;
            // your while loop
            while (count > 0) {
                next = curr.next;
                curr.next = prev;
                prev = curr;
                curr = next;
                count--;
            }

            // now:
            // prev = new head of reversed group
            // start = new tail of reversed group
            // curr = first node after group

            prevGroup.next = prev;   // connect previous group to new head
            start.next = curr;       // connect new tail to next group

            prevGroup = start;       // move prevGroup forward
            t--;
        }

        return dummy.next;
    }

}