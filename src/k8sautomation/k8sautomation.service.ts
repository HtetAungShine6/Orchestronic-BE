import { HttpService } from "@nestjs/axios";
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateClusterDeploymentRequestDto } from "./dto/request/create-deploy-request.dto";
import { firstValueFrom } from 'rxjs';

@Injectable()
export class K8sAutomationService {
    constructor(private readonly httpService: HttpService) {}

    async automateK8sDeployment(request: CreateClusterDeploymentRequestDto): Promise<void> {
        const k8s_base_url = process.env.K8S_AUTOMATION_BASE_API_URL || 'http://localhost:4003/_api/k8s-automation';
        const subpath = '/_api/k8s-automation';
        const path = 'initialize';

        try {
            const response$ = this.httpService.post(
                `${k8s_base_url}${subpath}/${path}`,
                request,
                {
                    headers: { 'Content-Type': 'application/json' },
                },
            );
            const resp = await firstValueFrom(response$);

            return resp.data;
        } catch (err: any) {
            throw new HttpException(
                {
                    message: 'Failed to automate K8s deployment',
                    details: err?.response?.data ?? err?.message ?? 'Unknown error',
                },
                err?.response?.status ?? HttpStatus.BAD_GATEWAY,
            );
        }
    }

}