import { judgeTokenRepository } from '../lib/repositories/judgeTokenRepository';

export const judgeTokenService = {
  async generateToken(payload: {
    judgeId: string;
    scheduleId: string;
    tenantId: string;
    createdBy: string;
  }) {
    const { data, error } = await judgeTokenRepository.generateToken<any>(payload);
    if (error) throw new Error(error.message);
    return data;
  },

  async validateToken(token: string) {
    const { data, error } = await judgeTokenRepository.validateToken<any>(token);
    if (error) throw new Error(error.message);
    return data;
  },

  async expireToken(token: string) {
    const { error } = await judgeTokenRepository.expireToken(token);
    if (error) throw new Error(error.message);
  },

  async listTokens(scheduleId: string) {
    const { data, error } = await judgeTokenRepository.listTokens<any>(scheduleId);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
