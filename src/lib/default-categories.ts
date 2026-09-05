export type CategorySeed = { name: string; icon?: string; children?: CategorySeed[] };

export const DEFAULT_CATEGORY_TREE: CategorySeed[] = [
  {
    name: "Home",
    icon: "🏠",
    children: [
      { name: "Rent / Mortgage" },
      { name: "Utilities" },
      { name: "Internet" },
      { name: "Phone" },
      { name: "Home Maintenance" },
      { name: "Household Supplies" },
      { name: "Furniture & Decor" },
    ],
  },
  {
    name: "Food",
    icon: "🍔",
    children: [
      { name: "Groceries" },
      { name: "Restaurants" },
      { name: "Takeout / Delivery" },
      { name: "Coffee" },
      { name: "Bars & Drinks" },
      { name: "Fast Food" },
    ],
  },
  {
    name: "Transportation",
    icon: "🚗",
    children: [
      { name: "Gas" },
      { name: "Public Transit" },
      { name: "Rideshare" },
      { name: "Parking" },
      { name: "Car Payment" },
      { name: "Car Insurance" },
      { name: "Maintenance" },
      { name: "Tolls" },
      { name: "Bike / Scooter" },
    ],
  },
  {
    name: "Shopping",
    icon: "🛍️",
    children: [
      { name: "Clothing" },
      { name: "Electronics" },
      { name: "Personal Items" },
      { name: "Hobbies" },
      { name: "Gifts" },
      { name: "Miscellaneous" },
    ],
  },
  {
    name: "Entertainment",
    icon: "🎮",
    children: [
      { name: "Streaming" },
      { name: "Movies & Events" },
      { name: "Games" },
      { name: "Sports" },
      { name: "Music" },
      { name: "Nightlife" },
      { name: "Subscriptions" },
    ],
  },
  {
    name: "Travel",
    icon: "✈️",
    children: [
      { name: "Flights" },
      { name: "Hotels" },
      { name: "Rental Cars" },
      { name: "Taxis / Rideshare" },
      { name: "Activities" },
      { name: "Travel Food" },
      { name: "Travel Shopping" },
    ],
  },
  {
    name: "Health & Wellness",
    icon: "💪",
    children: [
      { name: "Gym" },
      { name: "Medical" },
      { name: "Dental" },
      { name: "Pharmacy" },
      { name: "Fitness" },
      { name: "Therapy / Wellness" },
      { name: "Tobacco" },
    ],
  },
  {
    name: "Personal",
    icon: "👤",
    children: [
      { name: "Haircuts" },
      { name: "Beauty" },
      { name: "Personal Care" },
      { name: "Education" },
      { name: "Professional" },
      { name: "Laundry" },
    ],
  },
  {
    name: "Financial",
    icon: "💰",
    children: [
      { name: "Savings" },
      { name: "Investments" },
      { name: "Credit Card Payments" },
      { name: "Loans" },
      { name: "Bank Fees" },
      { name: "Taxes" },
      { name: "Insurance" },
      { name: "ATM Withdrawal" },
      { name: "Venmo / App Pay" },
    ],
  },
  {
    name: "Family & Giving",
    icon: "👨‍👩‍👧",
    children: [{ name: "Family" }, { name: "Childcare" }, { name: "Pets" }, { name: "Charities" }, { name: "Gifts" }],
  },
  {
    name: "Goals",
    icon: "🌱",
    children: [
      { name: "Emergency Fund" },
      { name: "Vacation" },
      { name: "House" },
      { name: "Car" },
      { name: "Investment" },
      { name: "Big Purchase" },
      { name: "Custom Goal" },
    ],
  },
  {
    name: "Money In",
    icon: "💵",
    children: [
      {
        name: "Income",
        children: [
          { name: "Paycheck" },
          { name: "Freelance" },
          { name: "Business Income" },
          { name: "Bonus" },
          { name: "Commission" },
          { name: "Tips" },
          { name: "Rental Income" },
          { name: "Interest" },
          { name: "Dividends" },
        ],
      },
      {
        name: "Other Money In",
        children: [
          { name: "Tax Refund" },
          { name: "Reimbursement" },
          { name: "Gift" },
          { name: "Cashback" },
          { name: "Sold Item" },
          { name: "Transfer In" },
          { name: "Cash Deposit" },
        ],
      },
      {
        name: "Advances",
        children: [{ name: "Employer Early Pay" }, { name: "Other Cash Advance" }],
      },
    ],
  },
];

/** Root category names whose transactions are inflows (Plaid: negative amount), not expenses. */
export const INCOME_ROOT_CATEGORIES = new Set(["Money In"]);
