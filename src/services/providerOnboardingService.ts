import { API_BASE_URL, apiService } from './api';

interface Step1Payload {
  fullName: string;
  businessName: string;
  email: string;
  phone?: string;
  alternativePhone?: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}

type StepPayload = Record<string, any>;

interface UploadResult {
  url: string;
  originalName?: string;
  filename?: string;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

const handleJsonResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

export const providerOnboardingService = {
  async registerStep1(payload: Step1Payload) {
    const response = await fetch(`${API_BASE_URL}/providers/register/step/1`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async saveProgress(step: number, data: StepPayload) {
    const token = await apiService.loadToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/providers/register/progress`, {
      method: 'PUT',
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentStep: step,
        stepData: data,
      }),
    });
    return handleJsonResponse(response);
  },

  async uploadDocuments(formData: FormData, token?: string) {
    const authToken = token || (await apiService.loadToken());
    if (!authToken) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/providers/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });
    return handleJsonResponse(response) as Promise<{ success: boolean; message?: string; files: UploadResult[] }>;
  },

  async uploadBrandImages(formData: FormData, token?: string) {
    const authToken = token || (await apiService.loadToken());
    if (!authToken) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/providers/brand-images/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });
    return handleJsonResponse(response) as Promise<{ success: boolean; message?: string; files: UploadResult[] }>;
  },

  async initializePayment(subscriptionPlanId: string, additionalData?: {
    fullName?: string;
    email?: string;
    businessName?: string;
    category?: string;
  }) {
    const token = await apiService.loadToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const payload: any = { subscriptionPlanId, platform: 'mobile' }; // Specify mobile platform
    
    // Add required fields if provided
    if (additionalData) {
      if (additionalData.fullName) payload.fullName = additionalData.fullName;
      if (additionalData.email) payload.email = additionalData.email;
      if (additionalData.businessName) payload.businessName = additionalData.businessName;
      if (additionalData.category) payload.category = additionalData.category;
    }

    const response = await fetch(`${API_BASE_URL}/providers/initialize-payment`, {
      method: 'POST',
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async validateReferralCode(code: string) {
    const response = await fetch(`${API_BASE_URL}/referrals/validate/${code}`);
    return handleJsonResponse(response);
  },
};

export type UploadServiceResult = Awaited<ReturnType<typeof providerOnboardingService.uploadDocuments>>;


