import { delay, http, withFallback } from "./client";
import { mockCustomers } from "./mockData";
import type { Customer, CustomerInput } from "./types";

// Backend (com.starsoft.voint.crm.dto.CustomerResponse / *Request) sahe adlari panelin daxili
// Customer tipinden ferqlidir (phoneNumber vs phone, notes vs note, lastSeenAt vs lastContactAt)
// — burada map olunur. callCount backend terefinde her muraciyetde CallRepository ile
// hesablanir (bootstrap heckmde bu qeder data ucun kifayetdir).
interface BackendCustomerResponse {
  id: string;
  tenantId: string;
  phoneNumber: string;
  name: string;
  notes: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  callCount: number;
}

interface BackendCustomerRequest {
  phoneNumber: string;
  name?: string;
  notes?: string;
}

function toCustomer(c: BackendCustomerResponse): Customer {
  return {
    id: c.id,
    phone: c.phoneNumber,
    name: c.name,
    note: c.notes ?? undefined,
    lastContactAt: c.lastSeenAt,
    callCount: c.callCount,
  };
}

// PATCH semantikasi: backend null saheleri deyismir, buna gore undefined saheleri
// obyektdən tamamile cixaririq (JSON.stringify onlari sile bilir), "" ile evez etmirik.
function toBackendRequest(input: Partial<CustomerInput>): Partial<BackendCustomerRequest> {
  const req: Partial<BackendCustomerRequest> = {};
  if (input.phone !== undefined) req.phoneNumber = input.phone;
  if (input.name !== undefined) req.name = input.name;
  if (input.note !== undefined) req.notes = input.note;
  return req;
}

export function getCustomers(tenantId: string): Promise<Customer[]> {
  return withFallback(
    async () => {
      const { data } = await http.get<BackendCustomerResponse[]>(
        `/tenants/${tenantId}/customers`,
      );
      return data.map(toCustomer);
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
      const { data } = await http.post<BackendCustomerResponse>(
        `/tenants/${tenantId}/customers`,
        toBackendRequest(input),
      );
      return toCustomer(data);
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
      const { data } = await http.patch<BackendCustomerResponse>(
        `/tenants/${tenantId}/customers/${customerId}`,
        toBackendRequest(input),
      );
      return toCustomer(data);
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
