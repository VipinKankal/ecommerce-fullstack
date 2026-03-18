import { publicApi } from "../Config/Api";
import { API_ROUTES } from "../Config/ApiRoutes";

export const FetchProducs = async () => {
  try {
      const response = await publicApi.get(API_ROUTES.products.list);
      return response.data;
  } catch (error) {
    return null;
  }
};
