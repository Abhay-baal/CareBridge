import api from "./api";

export const getParentChildRelationships =
  async () => {
    const response =
      await api.get("/parent-child");

    return response.data;
  };

export const getParents =
  getParentChildRelationships;


export const removeParent =
  async (relationshipId) => {
    const response =
      await api.delete(
        `/parent-child/${relationshipId}`
      );

    return response.data;
  };

export const switchActiveParent =
  async (relationshipId) => {
    const response =
      await api.patch(
        `/parent-child/active/${relationshipId}`
      );

    return response.data;
  };

/*
 * Get every member of the current user's family.
 *
 * Unlike getParentChildRelationships(), this endpoint is
 * intentionally universal and returns:
 *
 *   Parent
 *   Parent
 *   Child
 *   Child
 *
 * depending on who exists in the family.
 */
export const getFamilyMembers =
  async () => {
    const response =
      await api.get(
        "/parent-child/family-members"
      );

    return response.data;
  };
