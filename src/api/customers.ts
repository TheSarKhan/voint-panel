import { delay, http, withFallback } from "./client";
import { mockCustomers } from "./mockData";
import type { Customer, CustomerInput } from "./types";

export function getCustomers(tenantId: string): Promise<Customer[]> {
  return withFallback(
    async () => {
      const { data } = await http.get<Customer[]>(
        `/tenants/${tenantId}/customers`,
      );
      return data;
    },
    async () => {
      await delay();
      return [...mockCustomers];
    },
  );
}

export function createCustomer(
  tenantId: string,
  input: CustomerInput,
): Promise<Customer> {
  return withFallback(
    async () => {
      const { data } = await http.post<Customer>(
        `/tenants/${tenantId}/customers`,
        input,
      );
      return data;
    },
    async () => {
      await delay(300);
      const customer: Customer = {
        id: `cust-${Date.now()}`,
        phone: input.phone,
        name: input.name,
        note: input.note,
        lastContactAt: new Date().toISOString(),
        callCount: 0,
      };
      mockCustomers.unshift(customer);
      return customer;
    },
  );
}

export function updateCustomer(
  tenantId: string,
  customerId: string,
  input: Partial<CustomerInput>,
): Promise<Customer> {
  return withFallback(
    async () => {
      const { data } = await http.patch<Customer>(
        `/tenants/${tenantId}/customers/${customerId}`,
        input,
      );
      return data;
    },
    async () => {
      await delay(300);
      const customer = mockCustomers.find((c) => c.id === customerId);
      if (!customer) throw new Error("Musteri tapilmadi");
      Object.assign(customer, input);
      return customer;
    },
  );
}
