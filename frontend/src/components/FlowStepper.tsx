import { ReactElement } from 'react'
import {
  Step,
  StepLabel,
  Stepper,
  stepConnectorClasses,
  StepConnector,
  styled,
} from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'

export interface FlowStep {
  label: string
  icon: string
}

const Connector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 18,
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderTopWidth: 2,
  },
  [`&.${stepConnectorClasses.active}, &.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
}))

function StepIcon({
  active,
  completed,
  icon,
  index,
}: {
  active?: boolean
  completed?: boolean
  icon: string
  index: number
}) {
  return (
    <IconifyIcon
      icon={completed ? 'mdi:check-circle' : icon}
      width={index === 0 ? 24 : 22}
      height={index === 0 ? 24 : 22}
      color={completed || active ? 'primary.main' : 'text.disabled'}
    />
  )
}

export default function FlowStepper({
  steps,
  activeStep,
}: {
  steps: FlowStep[]
  activeStep: number
}): ReactElement {
  return (
    <Stepper activeStep={activeStep} alternativeLabel connector={<Connector />} sx={{ mb: 4 }}>
      {steps.map((step, index) => (
        <Step key={step.label} completed={index < activeStep}>
          <StepLabel
            StepIconComponent={(props) => <StepIcon {...props} icon={step.icon} index={index} />}
            sx={{
              '& .MuiStepLabel-label': {
                fontSize: 13,
                mt: 1,
                color: index <= activeStep ? 'common.white' : 'text.disabled',
                fontWeight: index === activeStep ? 600 : 400,
              },
            }}
          >
            {step.label}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  )
}
