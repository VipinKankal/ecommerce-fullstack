import { publicApi } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';

export const FetchProducs = async () => {
  try {
    const response = await publicApi.get(API_ROUTES.products.list);
    return response.data;
  } catch {
    return null;
  }
};
