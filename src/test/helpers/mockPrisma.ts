import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

/**
 * Deep-mocked Prisma client shared across tests.
 *
 * Usage in a test file:
 *
 *   import { vi, beforeEach } from "vitest";
 *   import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
 *
 *   vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
 *
 *   beforeEach(() => resetPrismaMock());
 *
 *   it("...", async () => {
 *     prismaMock.storedTrack.findFirst.mockResolvedValue({ ... } as any);
 *   });
 */
export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

export function resetPrismaMock() {
	mockReset(prismaMock);
}
