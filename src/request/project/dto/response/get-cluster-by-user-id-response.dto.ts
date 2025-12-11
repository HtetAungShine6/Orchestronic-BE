import { AzureK8sClusterDto } from "./cluster-response-azure.dto";

export class GetClusterByUserIdResponseDto {
    statuscode: number;
    message: AzureK8sClusterDto[];
}