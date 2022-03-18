

# Setup Colours
# ==============

colourCommitted <- "forestgreen"
colourNotCommitted <- "grey"

chartColours <- c("NotCommitted" = colourNotCommitted, "Committed" = colourCommitted)


chartCommittment <- function(candiateResponsesByParty) {
  candidateResponsesByPartyLong <- candidateResponsesByParty %>%
    select(candidatePartyName, responseRate, committedRate, notCommittedRate) %>%
    rename(NotCommitted = notCommittedRate, Committed = committedRate) %>%
    pivot_longer(
      cols = starts_with(c('Committed', 'NotCommitted')), 
      values_to = "rate",
      names_to = "measure")
  
  p <- candidateResponsesByPartyLong %>%
    mutate(measure = factor(measure,
                           levels = c("NotCommitted", "Committed"))) %>%
    ggplot() +
    theme_minimal() +
    scale_fill_manual(values = chartColours) +
    geom_bar(aes(x = candidatePartyName,
                 y = rate,
                 fill = measure,
                 # text = paste0(measure, " (", site_id, ")", "<br>",
                 #               "Annual Mean: ", round(rate, digits = 1))
                 ),
             stat = "identity", position = "stack")
  p <- p +
    ylab("Survey Responses") +
    theme(axis.title.x = element_blank(), 
          axis.ticks.x = element_blank(), 
          #axis.text.x = element_blank()
          ) +
    scale_y_continuous(labels=scales::percent)
  p +
    theme(legend.position = "none",
        panel.grid.major = element_blank(), panel.grid.minor = element_blank()
  )
}

