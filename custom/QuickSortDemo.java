public class QuickSortDemo {
    public static void main(String[] args){
        int[] arr = {3,2,1,4,5,6,2,4,5};
        quickSort(arr,0,arr.length - 1);
        for(int i: arr){
            System.out.print(i+" ");
        }
    }

    public static void quickSort(int[] arr, int start, int end){
        if(start < end){
            int partitionIndex = findParition(arr, start, end);
            quickSort(arr, start, partitionIndex - 1);
            quickSort(arr, partitionIndex + 1, end);
        }
    }

    public static int findParition(int[] arr, int start, int end){
        int pivot = arr[start];
        int i = start, j=end;
        while(i < j){

            while(pivot >= arr[i] && i <= end - 1){
                i++;
            }

            while (pivot < arr[j] && j>= start + 1){
                j--;
            }

            if(i < j)
                swap(arr, i,j);
        }

        swap(arr,start,j);
        return j;
    }

    public static void swap(int[] arr, int i, int j){
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}
