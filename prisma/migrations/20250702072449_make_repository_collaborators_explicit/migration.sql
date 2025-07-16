-- CreateTable
CREATE TABLE "RepositoryCollaborators" (
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositoryCollaborators_pkey" PRIMARY KEY ("userId","repositoryId")
);

-- AddForeignKey
ALTER TABLE "RepositoryCollaborators" ADD CONSTRAINT "RepositoryCollaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryCollaborators" ADD CONSTRAINT "RepositoryCollaborators_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
