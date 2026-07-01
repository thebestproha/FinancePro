insert into public.market_prices (symbol, asset_type, price, currency, source, meta)
values
    ('GOLD', 'commodity', 6500, 'INR', 'seed', '{"unit":"gram"}'),
    ('SILVER', 'commodity', 95, 'INR', 'seed', '{"unit":"gram"}'),
    ('NIFTY50', 'index', 24400, 'INR', 'seed', '{"unit":"index"}')
on conflict do nothing;

insert into public.loan_templates (name, principal, annual_rate, tenure_months, lender, notes)
values
    ('Home Loan', 2500000, 8.5, 240, 'Bank', 'Typical amortizing home loan template'),
    ('Car Loan', 1200000, 10.2, 84, 'Bank', 'Vehicle financing reference template'),
    ('Personal Loan', 300000, 16.5, 36, 'Private', 'High-cost debt template')
on conflict do nothing;
