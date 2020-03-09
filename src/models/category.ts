/* All arguments with ? are faculatative and are
 * not meant to be saved on any permanent storage (local or online)
 */
export interface Category {
  readonly uuid: string,
  afterCategoryUuid: string,
  name: string
}
