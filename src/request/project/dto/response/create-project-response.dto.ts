import { ProjectRequest } from "@prisma/client";
import { ProjectRequestDto } from "./project-request.dto";

export class CreateProjectResponseDto {
    statuscode: number;
    message: ProjectRequestDto;
}