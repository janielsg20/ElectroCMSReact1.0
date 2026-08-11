import { failure, success, type Result } from '../../domain/common/result'
import type { ProjectStructure } from '../../domain/project/structure-schema'
import type { ProjectRecord } from '../../domain/project/project-record'
import type { ReversibleProjectCommand, ProjectCommandFailure } from './project-command-bus'
import type { TreeOperationError } from '../../domain/project/tree-operations'

export type ProjectStructureMutation = (
  structure: ProjectStructure,
) => Result<ProjectStructure, TreeOperationError>

export class ProjectStructureCommand implements ReversibleProjectCommand<ProjectStructure> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly mutation: ProjectStructureMutation,
    readonly commandIds?: readonly string[],
  ) {}

  apply(current: ProjectRecord<ProjectStructure>): Result<ProjectRecord<ProjectStructure>, ProjectCommandFailure> {
    const mutated = this.mutation(structuredClone(current.project.payload))
    if (!mutated.ok) return failure({ message: mutated.error.message })
    return success({
      ...structuredClone(current),
      project: {
        ...structuredClone(current.project),
        payload: mutated.value,
      },
    })
  }
}
