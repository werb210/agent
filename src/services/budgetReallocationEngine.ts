export type ChannelRoi = {
  channel: string;
  roi: number;
};

export type BudgetAdjustment = {
  channel: string;
  recommendation: string;
  requiresApproval: true;
};

export function getRecommendedAdjustments(channels: ChannelRoi[]): BudgetAdjustment[] {
  return channels.flatMap((channel) => {
    if (channel.roi >= 1.5) {
      return [{
        channel: channel.channel,
        recommendation: "Increase budget by 15%",
        requiresApproval: true as const
      }];
    }

    if (channel.roi <= 0.8 && channel.roi > 0.4) {
      return [{
        channel: channel.channel,
        recommendation: "Decrease budget by 20%",
        requiresApproval: true as const
      }];
    }

    if (channel.roi <= 0.4) {
      return [{
        channel: channel.channel,
        recommendation: "Pause campaign",
        requiresApproval: true as const
      }];
    }

    return [];
  });
}
