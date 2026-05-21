import { prisma } from "../../config/prisma.js";
import { CURRENCY_ONBOARDING_SENTINEL } from "../../common/constants/currency.constants.js";

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const createUser = async (email: string, passwordHash: string) => {
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      preferredCurrency: CURRENCY_ONBOARDING_SENTINEL,
    },
  });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
};

export const updatePreferredCurrency = async (
  id: string,
  preferredCurrency: string,
) => {
  return prisma.user.update({
    where: { id },
    data: { preferredCurrency },
  });
};
