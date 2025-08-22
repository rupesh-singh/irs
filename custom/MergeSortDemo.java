import java.util.ArrayList;
import java.util.List;

public class MergeSortDemo
{
    public static void main(String[] args){
        int[] arr = {3,2,1,4,5,6,2,4,5};
        mergesort(arr,0,arr.length -1);
        for(int i: arr){
            System.out.print(i+" ");
        }
    }

    public static void mergesort(int[] arr, int start, int end){
        if(start >= end)
            return;

        int mid = (start + end)/2;
        mergesort(arr,start,mid);
        mergesort(arr,mid+1,end);
        merge(arr,start,mid,end);
    }

    public static void merge(int[] arr, int start, int mid, int end){
        List<Integer> temp = new ArrayList<>();
        int i=start, j=mid+1;

        while(i<= mid && j <= end){
            if(arr[i]< arr[j]){
                temp.add(arr[i++]);
            }
            else {
                temp.add(arr[j++]);
            }
        }

        while(i<=mid){
            temp.add(arr[i++]);
        }

        while(j <= end){
            temp.add(arr[j++]);
        }

        for(i=start;i<=end;i++){
            arr[i] = temp.get(i-start);
        }
    }


}
