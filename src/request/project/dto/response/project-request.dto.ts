import { Status } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";

export class ProjectRequestDto {
    id: string;
    displayCode: string;
    status: Status;
    description: string;
    repositoryId: string;
    azureK8sClusterId?: string;
    awsK8sClusterId?: string;
    ownerId: string;
    resourceId?: string;
    feedback: string;
}