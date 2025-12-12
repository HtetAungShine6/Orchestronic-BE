import { Module } from "@nestjs/common";
import { K8sAutomationService } from "./k8sautomation.service";

@Module({
    imports: [HttpModule],
    providers: [K8sAutomationService],
    exports: [K8sAutomationService],
})
export class K8sAutomationModule {}