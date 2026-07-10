import { forwardRef, InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Styled input + label + inline error, wired for react-hook-form via ref forwarding.
 * Usage: <FormField label="Email" error={errors.email?.message} {...register('email')} />
 */
const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id, ...inputProps }, ref) => {
    const fieldId = id ?? inputProps.name;
    const errorId = error ? `${fieldId}-error` : undefined;

    return (
      <div className="mb-5">
        <label
          htmlFor={fieldId}
          className="block font-['Inter'] text-sm font-medium text-[#26211C] mb-1.5"
        >
          {label}
        </label>
        <input
          id={fieldId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={[
            'w-full rounded-md border bg-white px-3.5 py-2.5',
            'font-[\'Inter\'] text-[0.95rem] text-[#26211C] placeholder:text-[#B9AD98]',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-[#C1442E] focus:border-[#C1442E] focus:ring-[#C1442E]/20'
              : 'border-[#E3D9C8] focus:border-[#4F6F5C] focus:ring-[#4F6F5C]/20',
          ].join(' ')}
          {...inputProps}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 font-['Inter'] text-[0.8rem] text-[#C1442E]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;