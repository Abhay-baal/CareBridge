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
