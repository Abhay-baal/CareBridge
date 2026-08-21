import api from "./api";

export const getFamilyMembers = () =>
  api.get("/family/members");

export const getFamilyMessages = () =>
  api.get("/family/messages");

export const getFamilyMessageStreak = () =>
  api.get("/family/message-streak");

export const sendFamilyMessage = (
  message,
  recipientIds = []
) =>
  api.post("/family/messages", {
    message,
    recipientIds,
  });

export const getFamilySnaps = () =>
  api.get("/family/snaps");

export const createFamilySnap = ({
  imageData,
  caption,
  recipientIds = [],
}) =>
  api.post("/family/snaps", {
    imageData,
    caption,
    recipientIds,
  });

export const deleteFamilySnap = (id) =>
  api.delete(`/family/snaps/${id}`);
